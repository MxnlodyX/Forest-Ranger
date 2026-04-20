from __future__ import annotations

from datetime import datetime

from flask import Blueprint, jsonify, request

from ..auth import require_auth
from ..models import get_db_connection

heatmap_bp = Blueprint('heatmap', __name__)


def _to_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _to_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _parse_datetime(value):
    if value in ('', None):
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        candidate = value.strip()
        if not candidate:
            return None
        if candidate.endswith('Z'):
            candidate = candidate[:-1] + '+00:00'
        try:
            return datetime.fromisoformat(candidate)
        except ValueError:
            return None
    return None


def _parse_coordinate_pair(raw_coordinate):
    if not isinstance(raw_coordinate, str):
        return None

    parts = [part.strip() for part in raw_coordinate.split(',')]
    if len(parts) != 2:
        return None

    lat = _to_float(parts[0])
    lng = _to_float(parts[1])
    if lat is None or lng is None:
        return None
    if lat < -90 or lat > 90 or lng < -180 or lng > 180:
        return None

    return lat, lng


def _derive_intensity(incident_type: str | None) -> int:
    value = (incident_type or '').strip().lower()
    if value in {'fire', 'emergency', 'poaching', 'logging'}:
        return 5
    if value in {'damage'}:
        return 4
    if value in {'wildlife', 'flood'}:
        return 3
    if value:
        return 2
    return 1


def _serialize_heat_incident(row: dict):
    coordinates = _parse_coordinate_pair(row.get('coordinates'))
    if not coordinates:
        return None

    lat, lng = coordinates
    created_at = row.get('created_at')
    return {
        'incident_id': row.get('incident_id'),
        'area_id': row.get('sector') or 'Unassigned',
        'lat': lat,
        'lng': lng,
        'intensity': _derive_intensity(row.get('incident_type')),
        'event_type': row.get('incident_type') or 'Unknown',
        'recorded_at': created_at.isoformat() if hasattr(created_at, 'isoformat') else created_at,
        'incident_title': row.get('incident_title'),
        'location_name': row.get('location_name'),
        'reporter_name': row.get('reporter_name'),
        'notes': row.get('description') or None,
    }


def _query_incident_rows(area_id: str | None, start_date, end_date, event_type: str | None):
    filters = ['l.coordinates IS NOT NULL', 'TRIM(l.coordinates) <> ""']
    params = []

    if area_id:
        filters.append('l.sector = %s')
        params.append(area_id)
    if start_date is not None:
        filters.append('ir.created_at >= %s')
        params.append(start_date)
    if end_date is not None:
        filters.append('ir.created_at <= %s')
        params.append(end_date)
    if event_type:
        filters.append('ir.incident_type = %s')
        params.append(event_type)

    where_clause = f"WHERE {' AND '.join(filters)}"

    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute(
            f"""
            SELECT
                ir.incident_id,
                ir.incident_title,
                ir.description,
                ir.incident_type,
                ir.created_at,
                l.location_name,
                l.sector,
                l.coordinates,
                s.full_name AS reporter_name
            FROM incident_report ir
            LEFT JOIN location l ON ir.location_id = l.location_id
            LEFT JOIN staff s ON ir.reported_by = s.staff_id
            {where_clause}
            ORDER BY ir.created_at DESC, ir.incident_id DESC
            """,
            params,
        )
        rows = cursor.fetchall()
    conn.close()
    return rows


@heatmap_bp.route('/api/heatmap/points/by-area', methods=['GET'])
@require_auth({'Back-Office', 'Field-Ops'})
def get_heatmap_points_by_area():
    area_id = (request.args.get('area_id') or '').strip()
    if not area_id:
        return jsonify({'error': 'area_id is required'}), 400

    start_date = _parse_datetime(request.args.get('start_date')) if request.args.get('start_date') else None
    end_date = _parse_datetime(request.args.get('end_date')) if request.args.get('end_date') else None
    event_type = (request.args.get('event_type') or '').strip() or None

    if request.args.get('start_date') and start_date is None:
        return jsonify({'error': 'start_date must be a valid ISO datetime'}), 400
    if request.args.get('end_date') and end_date is None:
        return jsonify({'error': 'end_date must be a valid ISO datetime'}), 400

    try:
        rows = _query_incident_rows(area_id, start_date, end_date, event_type)
        items = [item for item in (_serialize_heat_incident(row) for row in rows) if item is not None]
        return jsonify({'items': items, 'count': len(items), 'area_id': area_id})
    except Exception:
        return jsonify({'error': 'internal server error'}), 500


@heatmap_bp.route('/api/heatmap/points', methods=['GET'])
@require_auth({'Back-Office', 'Field-Ops'})
def get_heatmap_points_all_areas():
    start_date = _parse_datetime(request.args.get('start_date')) if request.args.get('start_date') else None
    end_date = _parse_datetime(request.args.get('end_date')) if request.args.get('end_date') else None
    event_type = (request.args.get('event_type') or '').strip() or None
    area_id = (request.args.get('area_id') or '').strip() or None

    if request.args.get('start_date') and start_date is None:
        return jsonify({'error': 'start_date must be a valid ISO datetime'}), 400
    if request.args.get('end_date') and end_date is None:
        return jsonify({'error': 'end_date must be a valid ISO datetime'}), 400

    page = _to_int(request.args.get('page')) or 1
    page_size = _to_int(request.args.get('page_size')) or 200
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 1
    if page_size > 1000:
        page_size = 1000

    try:
        rows = _query_incident_rows(area_id, start_date, end_date, event_type)
        items = [item for item in (_serialize_heat_incident(row) for row in rows) if item is not None]

        bounds = (request.args.get('bounds') or '').strip()
        if bounds:
            parts = [item.strip() for item in bounds.split(',')]
            if len(parts) != 4:
                return jsonify({'error': 'bounds must be minLat,minLng,maxLat,maxLng'}), 400
            min_lat = _to_float(parts[0])
            min_lng = _to_float(parts[1])
            max_lat = _to_float(parts[2])
            max_lng = _to_float(parts[3])
            if None in {min_lat, min_lng, max_lat, max_lng}:
                return jsonify({'error': 'bounds must contain valid numbers'}), 400
            if min_lat > max_lat or min_lng > max_lng:
                return jsonify({'error': 'bounds min values must be less than max values'}), 400
            items = [
                item for item in items
                if min_lat <= item['lat'] <= max_lat and min_lng <= item['lng'] <= max_lng
            ]

        total = len(items)
        offset = (page - 1) * page_size
        paged_items = items[offset:offset + page_size]

        return jsonify(
            {
                'items': paged_items,
                'count': len(paged_items),
                'total': total,
                'page': page,
                'page_size': page_size,
            }
        )
    except Exception:
        return jsonify({'error': 'internal server error'}), 500
