Feature: HeatMap Management
  ระบบต้องแสดง HeatMap จาก Incident Report ได้

  Scenario: ผู้ดูแลระบบดู HeatMap รายพื้นที่ได้
    Given ผู้ควบคุมกำลังพลอยู่ในหน้า HeatMap Management
    When เรียก API ดึงข้อมูล HeatMap รายพื้นที่ Zone A
    Then ระบบต้องส่งข้อมูล HeatMap จาก Incident Report ของพื้นที่นั้นกลับ

  Scenario: เจ้าหน้าที่ภาคสนามดู HeatMap รวมทุกพื้นที่ได้
    Given เจ้าหน้าที่ภาคสนามล็อกอินอยู่ในระบบ
    When เรียก API ดึงข้อมูล HeatMap ทุกพื้นที่
    Then ระบบต้องส่งข้อมูล HeatMap จาก Incident Report กลับ
