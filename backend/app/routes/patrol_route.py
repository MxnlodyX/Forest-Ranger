from __future__ import annotations

from flask import Blueprint, jsonify, request, session

from ..auth import require_auth
from ..models import get_db_connection

patrol_route_bp = Blueprint('patrol_route', __name__)

_VALID_STATUS = {'Draft', 'Active', 'Archived'}


def _serialize_row(row: dict) -> dict:
    result = {}
    for key, val in row.items():
        if hasattr(val, 'isoformat'):
            result[key] = val.isoformat()
        else:
            result[key] = val
    return result


def _to_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _validate_points(points):
    if not isinstance(points, list):
        return None, 'points must be an array'
    if len(points) < 2:
        return None, 'at least 2 points are required'
    if len(points) > 300:
        return None, 'maximum 300 points per route'

    normalized = []
    for index, point in enumerate(points):
        if not isinstance(point, dict):
            return None, f'point at index {index} must be an object'

        lat = _to_float(point.get('lat'))
        lng = _to_float(point.get('lng'))
        label = (point.get('label') or '').strip() or None

        if lat is None or lng is None:
            return None, f'point at index {index} must include valid lat/lng'
        if lat < -90 or lat > 90:
            return None, f'point at index {index} has invalid lat'
        if lng < -180 or lng > 180:
            return None, f'point at index {index} has invalid lng'

        normalized.append({'lat': lat, 'lng': lng, 'label': label})

    return normalized, None


def _attach_points(cursor, routes: list[dict]) -> list[dict]:
    if not routes:
        return routes

    route_ids = [r['route_id'] for r in routes]
    placeholders = ', '.join(['%s'] * len(route_ids))
    cursor.execute(
        f"""
        SELECT point_id, route_id, seq_no, lat, lng, label
        FROM patrol_route_point
        WHERE route_id IN ({placeholders})
        ORDER BY route_id ASC, seq_no ASC
        """,
        route_ids,
    )
    rows = cursor.fetchall()

    by_route = {r['route_id']: [] for r in routes}
    for row in rows:
        by_route[row['route_id']].append(_serialize_row(row))

    for route in routes:
        route['points'] = by_route.get(route['route_id'], [])

    return routes


def _fetch_route(cursor, route_id: int):
    cursor.execute(
        """
        SELECT
            pr.route_id,
            pr.route_name,
            pr.created_by,
            s.full_name AS creator_name,
            pr.status,
            pr.distance_km,
            pr.estimated_minutes,
            pr.created_at,
            pr.updated_at
        FROM patrol_route pr
        LEFT JOIN staff s ON pr.created_by = s.staff_id
        WHERE pr.route_id = %s
        LIMIT 1
        """,
        (route_id,),
    )
    route = cursor.fetchone()
    if not route:
        return None

    serialized = _serialize_row(route)
    _attach_points(cursor, [serialized])
    return serialized


def _can_access_route(route: dict, staff_role: str, staff_id: int) -> bool:
    if staff_role == 'Back-Office':
        return True
    return route.get('created_by') == staff_id


@patrol_route_bp.route('/api/patrol-routes', methods=['GET'])
@require_auth({'Back-Office', 'Field-Ops'})
def get_patrol_routes():
    staff_id = session.get('staff_id')
    staff_role = session.get('staff_role')

    status = request.args.get('status', type=str)
    requested_created_by = request.args.get('created_by', type=int)
    created_by = requested_created_by if requested_created_by is not None else staff_id

    if staff_role == 'Field-Ops':
        created_by = staff_id

    filters = []
    params = []
    if created_by is not None:
        filters.append('pr.created_by = %s')
        params.append(created_by)
    if status:
        if status not in _VALID_STATUS:
            return jsonify({'error': 'status must be Draft, Active, or Archived'}), 400
        filters.append('pr.status = %s')
        params.append(status)

    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ''

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                f"""
                SELECT
                    pr.route_id,
                    pr.route_name,
                    pr.created_by,
                    s.full_name AS creator_name,
                    pr.status,
                    pr.distance_km,
                    pr.estimated_minutes,
                    pr.created_at,
                    pr.updated_at
                FROM patrol_route pr
                LEFT JOIN staff s ON pr.created_by = s.staff_id
                {where_clause}
                ORDER BY pr.updated_at DESC, pr.route_id DESC
                """,
                params,
            )
            routes = [_serialize_row(r) for r in cursor.fetchall()]
            _attach_points(cursor, routes)
        conn.close()
        return jsonify(routes)
    except Exception:
        return jsonify({'error': 'internal server error'}), 500


@patrol_route_bp.route('/api/patrol-routes/<int:route_id>', methods=['GET'])
@require_auth({'Back-Office', 'Field-Ops'})
def get_patrol_route_by_id(route_id: int):
    staff_id = session.get('staff_id')
    staff_role = session.get('staff_role')

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            route = _fetch_route(cursor, route_id)
        conn.close()

        if not route:
            return jsonify({'error': 'Route not found'}), 404
        if not _can_access_route(route, staff_role, staff_id):
            return jsonify({'error': 'forbidden'}), 403

        return jsonify(route)
    except Exception:
        return jsonify({'error': 'internal server error'}), 500


@patrol_route_bp.route('/api/patrol-routes', methods=['POST'])
@require_auth({'Back-Office', 'Field-Ops'})
def create_patrol_route():
    payload = request.get_json(silent=True) or {}

    route_name = (payload.get('route_name') or '').strip()
    if not route_name:
        return jsonify({'error': 'route_name is required'}), 400

    status = (payload.get('status') or 'Draft').strip() or 'Draft'
    if status not in _VALID_STATUS:
        return jsonify({'error': 'status must be Draft, Active, or Archived'}), 400

    estimated_minutes = payload.get('estimated_minutes')
    if estimated_minutes in ('', None):
        estimated_minutes = None
    elif not isinstance(estimated_minutes, int) or estimated_minutes < 0:
        return jsonify({'error': 'estimated_minutes must be a non-negative integer'}), 400

    points, err = _validate_points(payload.get('points'))
    if err:
        return jsonify({'error': err}), 400

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO patrol_route (route_name, created_by, status, estimated_minutes)
                VALUES (%s, %s, %s, %s)
                """,
                (route_name, session.get('staff_id'), status, estimated_minutes),
            )
            route_id = cursor.lastrowid

            for seq_no, point in enumerate(points, start=1):
                cursor.execute(
                    """
                    INSERT INTO patrol_route_point (route_id, seq_no, lat, lng, label)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (route_id, seq_no, point['lat'], point['lng'], point['label']),
                )

            route = _fetch_route(cursor, route_id)
            conn.commit()
        conn.close()
        return jsonify(route), 201
    except Exception:
        return jsonify({'error': 'internal server error'}), 500


@patrol_route_bp.route('/api/patrol-routes/<int:route_id>', methods=['PUT'])
@require_auth({'Back-Office', 'Field-Ops'})
def update_patrol_route(route_id: int):
    payload = request.get_json(silent=True) or {}
    staff_id = session.get('staff_id')
    staff_role = session.get('staff_role')

    if not payload:
        return jsonify({'error': 'request body is required'}), 400

    updates = []
    values = []

    if 'route_name' in payload:
        route_name = (payload.get('route_name') or '').strip()
        if not route_name:
            return jsonify({'error': 'route_name cannot be empty'}), 400
        updates.append('route_name = %s')
        values.append(route_name)

    if 'status' in payload:
        status = (payload.get('status') or '').strip()
        if status not in _VALID_STATUS:
            return jsonify({'error': 'status must be Draft, Active, or Archived'}), 400
        updates.append('status = %s')
        values.append(status)

    if 'estimated_minutes' in payload:
        estimated_minutes = payload.get('estimated_minutes')
        if estimated_minutes in ('', None):
            estimated_minutes = None
        elif not isinstance(estimated_minutes, int) or estimated_minutes < 0:
            return jsonify({'error': 'estimated_minutes must be a non-negative integer'}), 400
        updates.append('estimated_minutes = %s')
        values.append(estimated_minutes)

    points = None
    if 'points' in payload:
        points, err = _validate_points(payload.get('points'))
        if err:
            return jsonify({'error': err}), 400

    if not updates and points is None:
        return jsonify({'error': 'no valid fields to update'}), 400

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            existing = _fetch_route(cursor, route_id)
            if not existing:
                conn.close()
                return jsonify({'error': 'Route not found'}), 404
            if not _can_access_route(existing, staff_role, staff_id):
                conn.close()
                return jsonify({'error': 'forbidden'}), 403

            if updates:
                values.append(route_id)
                cursor.execute(
                    f"UPDATE patrol_route SET {', '.join(updates)} WHERE route_id = %s",
                    values,
                )

            if points is not None:
                cursor.execute('DELETE FROM patrol_route_point WHERE route_id = %s', (route_id,))
                for seq_no, point in enumerate(points, start=1):
                    cursor.execute(
                        """
                        INSERT INTO patrol_route_point (route_id, seq_no, lat, lng, label)
                        VALUES (%s, %s, %s, %s, %s)
                        """,
                        (route_id, seq_no, point['lat'], point['lng'], point['label']),
                    )

            updated = _fetch_route(cursor, route_id)
            conn.commit()
        conn.close()
        return jsonify(updated)
    except Exception:
        return jsonify({'error': 'internal server error'}), 500


@patrol_route_bp.route('/api/patrol-routes/<int:route_id>', methods=['DELETE'])
@require_auth({'Back-Office', 'Field-Ops'})
def delete_patrol_route(route_id: int):
    staff_id = session.get('staff_id')
    staff_role = session.get('staff_role')

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            existing = _fetch_route(cursor, route_id)
            if not existing:
                conn.close()
                return jsonify({'error': 'Route not found'}), 404
            if not _can_access_route(existing, staff_role, staff_id):
                conn.close()
                return jsonify({'error': 'forbidden'}), 403

            cursor.execute('DELETE FROM patrol_route WHERE route_id = %s', (route_id,))
            conn.commit()
        conn.close()
        return jsonify({'message': 'Route deleted successfully'})
    except Exception:
        return jsonify({'error': 'internal server error'}), 500
