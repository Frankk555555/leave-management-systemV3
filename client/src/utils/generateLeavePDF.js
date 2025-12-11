import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// ชื่อประเภทการลา
const LEAVE_TYPE_NAMES = {
  sick: "ลาป่วย",
  personal: "ลากิจส่วนตัว",
  vacation: "ลาพักผ่อน",
  maternity: "ลาคลอดบุตร",
  paternity: "ลาไปช่วยเหลือภริยาที่คลอดบุตร",
  childcare: "ลาเลี้ยงดูบุตร",
  ordination: "ลาอุปสมบท",
  military: "ลาตรวจเลือก/เตรียมพล",
};

/**
 * แปลงวันที่เป็นรูปแบบไทย
 */
const formatThaiDate = (dateString) => {
  const date = new Date(dateString);
  const thaiMonths = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543;
  return { day, month, year, fullDate: `${day} ${month} ${year}` };
};

// URL ตราครุฑ
const GARUDA_IMAGE_URL =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjp4qhJsdO9oQO_YcVWIR98AjzgeTpTUaRWg&s";

/**
 * สร้าง HTML สำหรับหัวเอกสาร (ใช้ร่วมกัน)
 */
const getHeaderHTML = (title, subtitle = "") => `
  <div style="display: flex; justify-content: space-between; margin-bottom: 15px; align-items: flex-start;">
    <div style="flex: 1; text-align: center;">
      <img src="${GARUDA_IMAGE_URL}" alt="ตราครุฑ" style="width: 60px; height: auto;" crossorigin="anonymous" />
    </div>
    <div style="flex: 2; text-align: center;">
      <div style="font-size: 12px; color: #666; margin-bottom: 5px;">${subtitle}</div>
      <h2 style="margin: 0; font-size: 22px; font-weight: bold;">${title}</h2>
    </div>
    <div style="flex: 1; text-align: right; font-size: 12px; border: 1px solid #000; padding: 8px;">
      <div style="font-weight: bold;">กองการบริหารงานบุคคล</div>
      <div>รับที่....................................</div>
      <div>วันที่....................................</div>
      <div>เวลา....................................</div>
    </div>
  </div>
`;

/**
 * สร้าง HTML สำหรับส่วนราชการ (ใช้ร่วมกัน)
 */
const getDepartmentHTML = (userData, today, subject) => `
  <div style="margin-bottom: 15px; font-size: 14px;">
    <div style="margin-bottom: 5px;">
      <strong>ส่วนราชการ</strong> ${
        userData.department || "............................................."
      }
    </div>
    <div style="margin-bottom: 5px;">
      <strong>ที่</strong> ........................... 
      <span style="margin-left: 50px;"><strong>วันที่</strong> ${
        today.day
      }</span>
      <span style="margin-left: 10px;">เดือน ${today.month}</span>
      <span style="margin-left: 10px;">พ.ศ. ${today.year}</span>
    </div>
    <div style="margin-bottom: 5px;">
      <strong>เรื่อง</strong> ${subject}
    </div>
    <div style="margin-bottom: 5px;">
      <strong>เรียน</strong> อธิการบดีมหาวิทยาลัยราชภัฏบุรีรัมย์
    </div>
  </div>
`;

/**
 * สร้าง HTML สำหรับข้อมูลผู้ขอลา
 */
const getEmployeeInfoHTML = (userData) => `
  <div style="margin: 10px 0; font-size: 14px; line-height: 1.8;">
    <div style="text-indent: 50px;">
      ข้าพเจ้า <strong>${userData.firstName || ""} ${
  userData.lastName || ""
}</strong>
      <span style="margin-left: 50px;">ตำแหน่ง <strong>${
        userData.position || "............................."
      }</strong></span>
    </div>
    <div>
      สังกัดสาขาวิชา/หน่วยงาน <strong>${
        userData.department || "............................."
      }</strong>
      <span style="margin-left: 30px;">คณะ/สำนัก/สถาบัน ...............................</span>
    </div>
    <div>มหาวิทยาลัยราชภัฏบุรีรัมย์</div>
  </div>
`;

/**
 * สร้าง HTML สำหรับตารางสถิติการลา (แบบ 4 คอลัมน์)
 */
const getLeaveStatsTable4Col = () => `
  <div style="margin: 20px 0;">
    <div style="font-weight: bold; margin-bottom: 10px;">สถิติการลาในปีงบประมาณนี้</div>
    <table style="width: 60%; border-collapse: collapse; font-size: 12px;">
      <tr>
        <th style="border: 1px solid #000; padding: 5px; text-align: center;">ประเภทลา</th>
        <th style="border: 1px solid #000; padding: 5px; text-align: center;">ลามาแล้ว<br>(วันทำการ)</th>
        <th style="border: 1px solid #000; padding: 5px; text-align: center;">ลาครั้งนี้<br>(วันทำการ)</th>
        <th style="border: 1px solid #000; padding: 5px; text-align: center;">รวมเป็น<br>(วันทำการ)</th>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 8px;">ป่วย</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;"></td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;"></td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;"></td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 8px;">กิจส่วนตัว</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;"></td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;"></td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;"></td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 8px;">คลอดบุตร</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;"></td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;"></td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;"></td>
      </tr>
    </table>
  </div>
`;

/**
 * สร้าง HTML สำหรับส่วนลายเซ็นและความเห็น
 */
const getSignatureHTML = () => `
  <div style="margin: 20px 0; font-size: 13px;">
    <div style="margin-bottom: 15px;">
      <strong>ลงทะเบียนวันลาแล้ว</strong>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div>(ลงชื่อ)............................................ ผู้ตรวจสอบ<br><span style="padding-left: 35px;">(.............................................)</span></div>
      <div>(ลงชื่อ)............................................ ผอ.กองการบริหารงานบุคคล<br><span style="padding-left: 35px;">(.............................................)</span></div>
    </div>
  </div>

  <div style="display: flex; justify-content: space-between; font-size: 13px; margin-top: 20px;">
    <div style="width: 45%;">
      <div style="font-weight: bold; margin-bottom: 20px;">๑. ความเห็นของหัวหน้าสำนักงาน/หัวหน้าภาค/<br>หัวหน้าสาขาวิชา/หัวหน้างาน</div>
      <div style="margin-top: 30px;">(ลงชื่อ).............................................<br><span style="padding-left: 35px;">(.............................................)</span></div>
    </div>
    <div style="width: 45%;">
      <div style="font-weight: bold; margin-bottom: 20px;">๒. ความเห็นของคณบดี/ผอ.สำนัก/ผอ.สถาบัน</div>
      <div style="margin-top: 30px;">(ลงชื่อ).............................................<br><span style="padding-left: 35px;">(.............................................)</span></div>
    </div>
  </div>

  <div style="display: flex; justify-content: flex-end; font-size: 13px; margin-top: 30px;">
    <div style="width: 45%;">
      <div style="font-weight: bold; margin-bottom: 10px;">๓. คำสั่งรองอธิการบดีฝ่ายบริหารงานบุคคล<br>และเทคโนโลยีสารสนเทศ</div>
      <div style="margin: 10px 0;">
        <span style="margin-right: 30px;">☐ อนุญาต</span>
        <span>☐ ไม่อนุญาต</span>
      </div>
      <div style="margin-top: 20px;">(ลงชื่อ).............................................<br><span style="padding-left: 35px;">(.............................................)</span></div>
      <div style="margin-top: 10px;">วันที่ ............/....................../...............</div>
    </div>
  </div>
`;

/**
 * ฟอร์มที่ 1: ลาป่วย / ลากิจส่วนตัว / ลาคลอดบุตร
 */
const generateSickPersonalMaternityForm = (
  leaveData,
  userData,
  today,
  startDate,
  endDate
) => {
  const leaveTypeName = LEAVE_TYPE_NAMES[leaveData.leaveType];
  const isCheckedSick = leaveData.leaveType === "sick" ? "☑" : "☐";
  const isCheckedPersonal = leaveData.leaveType === "personal" ? "☑" : "☐";
  const isCheckedMaternity = leaveData.leaveType === "maternity" ? "☑" : "☐";

  return `
    <div id="leave-form-pdf" style="
      width: 210mm;
      min-height: 297mm;
      padding: 15mm 20mm;
      font-family: 'TH Sarabun New', 'Sarabun', sans-serif;
      font-size: 14px;
      line-height: 1.5;
      background: white;
      color: black;
    ">
      ${getHeaderHTML(
        "บันทึกข้อความ",
        "(หนังสือขออนุญาตลาป่วย ลาคลอดบุตร ลากิจส่วนตัว)"
      )}
      ${getDepartmentHTML(userData, today, "ขออนุญาตลาหยุดราชการ")}
      ${getEmployeeInfoHTML(userData)}

      <div style="margin: 15px 0; font-size: 14px; text-indent: 50px;">
        มีความประสงค์ขออนุญาต 
        <span style="margin: 0 10px;">${isCheckedSick} ลาป่วย</span>
        <span style="margin: 0 10px;">${isCheckedPersonal} ลากิจส่วนตัว</span>
        <span style="margin: 0 10px;">${isCheckedMaternity} ลาคลอดบุตร</span>
      </div>

      <div style="margin: 10px 0; font-size: 14px;">
        <div>เนื่องจาก (เหตุผล) <strong>${
          leaveData.reason ||
          "............................................................................................."
        }</strong></div>
        <div style="margin-top: 10px;">
          ตั้งแต่วันที่ <strong>${startDate.day}</strong> / <strong>${
    startDate.month
  }</strong> / <strong>${startDate.year}</strong>
          <span style="margin-left: 20px;">ถึงวันที่ <strong>${
            endDate.day
          }</strong> / <strong>${endDate.month}</strong> / <strong>${
    endDate.year
  }</strong></span>
          <span style="margin-left: 20px;">มีกำหนด <strong>${
            leaveData.totalDays || "......."
          }</strong> วัน</span>
        </div>
        <div style="margin-top: 10px;">
          ข้าพเจ้าได้ ${isCheckedSick} ลาป่วย ${isCheckedPersonal} ลากิจส่วนตัว ${isCheckedMaternity} ลาคลอดบุตร ครั้งสุดท้ายเมื่อวันที่ ......./........./..........
        </div>
        <div style="margin-top: 5px;">
          ถึงวันที่ ......./........./.......... /.......... มีกำหนด .............. วัน ในระหว่างลาจะติดต่อข้าพเจ้าได้ที่
        </div>
        <div style="margin-top: 5px;">
          ............................................................................................................................................................
        </div>
        <div style="margin-top: 15px; text-indent: 50px;">จึงเรียนมาเพื่อโปรดพิจารณา</div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 20px;">
        <div style="width: 55%;">
          ${getLeaveStatsTable4Col()}
        </div>
        <div style="width: 40%; padding-left: 20px;">
          <div style="margin-bottom: 30px;">
            (ลงชื่อ).............................................<br>
            <div style="text-align: center;">(.............................................)</div>
          </div>
        </div>
      </div>

      ${getSignatureHTML()}

      <div style="margin-top: 20px; font-size: 12px; border-top: 1px solid #ccc; padding-top: 10px;">
        <strong>หมายเหตุ:</strong> การลงนามของผู้บังคับบัญชาตามลำดับชั้นให้ระบุ ชื่อ - สกุล ให้ครบถ้วน
      </div>
    </div>
  `;
};

/**
 * ฟอร์มที่ 2: ลาไปช่วยเหลือภริยาที่คลอดบุตร
 */
const generatePaternityForm = (
  leaveData,
  userData,
  today,
  startDate,
  endDate
) => {
  return `
    <div id="leave-form-pdf" style="
      width: 210mm;
      min-height: 297mm;
      padding: 15mm 20mm;
      font-family: 'TH Sarabun New', 'Sarabun', sans-serif;
      font-size: 14px;
      line-height: 1.5;
      background: white;
      color: black;
    ">
      ${getHeaderHTML(
        "บันทึกข้อความ",
        "(หนังสือขออนุญาตลาไปช่วยเหลือภริยาที่คลอดบุตร)"
      )}
      ${getDepartmentHTML(
        userData,
        today,
        "ขออนุญาตลาไปช่วยเหลือภริยาที่คลอดบุตร"
      )}
      ${getEmployeeInfoHTML(userData)}

      <div style="margin: 15px 0; font-size: 14px; text-indent: 50px;">
        มีความประสงค์ขออนุญาตลาไปช่วยเหลือภริยาโดยชอบด้วยกฎหมายชื่อ .....................................................
      </div>

      <div style="margin: 10px 0; font-size: 14px;">
        <div>
          ซึ่งคลอดบุตรเมื่อวันที่ ......./........./.......... จึงขออนุญาตลาไปช่วยเหลือภริยาที่คลอดบุตรตั้งแต่วันที่
        </div>
        <div style="margin-top: 10px;">
          <strong>${startDate.day}</strong> / <strong>${
    startDate.month
  }</strong> / <strong>${startDate.year}</strong>
          <span style="margin-left: 20px;">ถึงวันที่ <strong>${
            endDate.day
          }</strong> / <strong>${endDate.month}</strong> / <strong>${
    endDate.year
  }</strong></span>
          <span style="margin-left: 20px;">มีกำหนด <strong>${
            leaveData.totalDays || "......."
          }</strong> วัน</span>
        </div>
        <div style="margin-top: 10px;">
          ในระหว่างลาจะติดต่อข้าพเจ้าได้ที่ ............................................................................................
        </div>
        <div style="margin-top: 15px; text-indent: 50px;">จึงเรียนมาเพื่อโปรดพิจารณา</div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 20px;">
        <div style="width: 55%;">
          <div style="font-weight: bold; margin-bottom: 10px;">สถิติการลาในปีงบประมาณนี้</div>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <tr>
              <th style="border: 1px solid #000; padding: 5px; text-align: center;" rowspan="2">ประเภทลา</th>
              <th style="border: 1px solid #000; padding: 5px; text-align: center;">ลามาแล้ว</th>
              <th style="border: 1px solid #000; padding: 5px; text-align: center;">ลาครั้งนี้</th>
              <th style="border: 1px solid #000; padding: 5px; text-align: center;">รวมเป็น</th>
            </tr>
            <tr>
              <th style="border: 1px solid #000; padding: 3px; text-align: center; font-size: 10px;">(วันทำการ)</th>
              <th style="border: 1px solid #000; padding: 3px; text-align: center; font-size: 10px;">(วันทำการ)</th>
              <th style="border: 1px solid #000; padding: 3px; text-align: center; font-size: 10px;">(วันทำการ)</th>
            </tr>
            <tr>
              <td style="border: 1px solid #000; padding: 8px;">ช่วยเหลือ<br>ภริยาที่<br>คลอดบุตร</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;"></td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${
                leaveData.totalDays || ""
              }</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;"></td>
            </tr>
          </table>
        </div>
        <div style="width: 40%; padding-left: 20px;">
          <div style="margin-bottom: 30px;">
            (ลงชื่อ).............................................<br>
            <div style="text-align: center;">(.............................................)</div>
          </div>
        </div>
      </div>

      ${getSignatureHTML()}

      <div style="margin-top: 20px; font-size: 12px; border-top: 1px solid #ccc; padding-top: 10px;">
        <strong>หมายเหตุ:</strong> การลงนามของผู้บังคับบัญชาตามลำดับชั้นให้ระบุ ชื่อ - สกุล ให้ครบถ้วน
      </div>
    </div>
  `;
};

/**
 * ฟอร์มที่ 3: ลาพักผ่อน
 */
const generateVacationForm = (
  leaveData,
  userData,
  today,
  startDate,
  endDate
) => {
  return `
    <div id="leave-form-pdf" style="
      width: 210mm;
      min-height: 297mm;
      padding: 15mm 20mm;
      font-family: 'TH Sarabun New', 'Sarabun', sans-serif;
      font-size: 14px;
      line-height: 1.5;
      background: white;
      color: black;
    ">
      ${getHeaderHTML("บันทึกข้อความ", "(หนังสือขออนุญาตลาพักผ่อน)")}
      ${getDepartmentHTML(userData, today, "ขออนุญาตลาพักผ่อน")}
      ${getEmployeeInfoHTML(userData)}

      <div style="margin: 15px 0; font-size: 14px;">
        <div>
          มีวันลาพักผ่อนสะสม ............ วันทำการ มีสิทธิลาพักผ่อนประจำปีนี้อีก ๑๐ วันทำการ รวมเป็น ............ วันทำการ
        </div>
        <div style="margin-top: 10px;">
          ขอลาพักผ่อนตั้งแต่วันที่ <strong>${startDate.day} ${
    startDate.month
  } ${startDate.year}</strong>
          <span style="margin-left: 20px;">ถึงวันที่ <strong>${endDate.day} ${
    endDate.month
  } ${endDate.year}</strong></span>
          <span style="margin-left: 20px;">มีกำหนด <strong>${
            leaveData.totalDays || "......."
          }</strong> วัน</span>
        </div>
        <div style="margin-top: 10px;">
          ในระหว่างลา จะติดต่อข้าพเจ้าได้ที่ ............................................................................................
        </div>
        <div style="margin-top: 15px; text-indent: 50px;">จึงเรียนมาเพื่อโปรดพิจารณา</div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 20px;">
        <div style="width: 55%;">
          <div style="font-weight: bold; margin-bottom: 10px;">สถิติการลาในปีงบประมาณนี้</div>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <tr>
              <th style="border: 1px solid #000; padding: 5px; text-align: center;">ลามาแล้ว<br>(วันทำการ)</th>
              <th style="border: 1px solid #000; padding: 5px; text-align: center;">ลาครั้งนี้<br>(วันทำการ)</th>
              <th style="border: 1px solid #000; padding: 5px; text-align: center;">รวมเป็น<br>(วันทำการ)</th>
              <th style="border: 1px solid #000; padding: 5px; text-align: center;">คงเหลือสะสม<br>(วันทำการ)</th>
            </tr>
            <tr>
              <td style="border: 1px solid #000; padding: 15px; text-align: center;"></td>
              <td style="border: 1px solid #000; padding: 15px; text-align: center;">${
                leaveData.totalDays || ""
              }</td>
              <td style="border: 1px solid #000; padding: 15px; text-align: center;"></td>
              <td style="border: 1px solid #000; padding: 15px; text-align: center;"></td>
            </tr>
          </table>
        </div>
        <div style="width: 40%; padding-left: 20px;">
          <div style="margin-bottom: 30px;">
            (ลงชื่อ).............................................<br>
            <div style="text-align: center;">(.............................................)</div>
          </div>
        </div>
      </div>

      <div style="margin: 20px 0;">
        <strong>ลงทะเบียนวันลาแล้ว</strong><br>
        <div style="margin-top: 10px;">(ลงชื่อ)............................................ ผู้ตรวจสอบ<br><span style="padding-left: 35px;">(.............................................)</span></div>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 13px; margin-top: 30px;">
        <div style="width: 45%;">
          <div style="font-weight: bold;">๑. ความเห็นของหัวหน้าสำนักงาน/หัวหน้าภาค/<br>หัวหน้าสาขาวิชา/หัวหน้างาน</div>
          <div style="margin-top: 30px;">(ลงชื่อ).............................................<br>(.............................................)</div>
          <div style="font-weight: bold; margin-top: 30px;">๒. ความเห็นของคณบดี/ผอ.สำนัก/ผอ.สถาบัน</div>
          <div style="margin-top: 30px;">(ลงชื่อ).............................................<br>(.............................................)</div>
        </div>
        <div style="width: 45%;">
          <div style="font-weight: bold;">๓. ความเห็นของผู้อำนวยการกองการบริหารงาน<br>บุคคล</div>
          <div style="margin-top: 30px;">(ลงชื่อ).............................................<br>(.............................................)</div>
          <div style="font-weight: bold; margin-top: 30px;">๔. คำสั่งรองอธิการบดีฝ่ายบริหารงานบุคคล<br>และเทคโนโลยีสารสนเทศ</div>
          <div style="margin: 10px 0;">
            <span style="margin-right: 30px;">☐ อนุญาต</span>
            <span>☐ ไม่อนุญาต</span>
          </div>
          <div style="margin-top: 15px;">(ลงชื่อ).............................................<br>(.............................................)</div>
        </div>
      </div>

      <div style="margin-top: 20px; font-size: 12px; border-top: 1px solid #ccc; padding-top: 10px;">
        <strong>หมายเหตุ:</strong> การลงนามของผู้บังคับบัญชาตามลำดับชั้นให้ระบุ ชื่อ - สกุล ให้ครบถ้วน
      </div>
    </div>
  `;
};

/**
 * ฟอร์มที่ 4: ลาอุปสมบท
 */
const generateOrdinationForm = (
  leaveData,
  userData,
  today,
  startDate,
  endDate
) => {
  return `
    <div id="leave-form-pdf" style="
      width: 210mm;
      min-height: 297mm;
      padding: 15mm 20mm;
      font-family: 'TH Sarabun New', 'Sarabun', sans-serif;
      font-size: 14px;
      line-height: 1.5;
      background: white;
      color: black;
    ">
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px; align-items: flex-start;">
        <div style="flex: 1;"></div>
        <div style="flex: 2; text-align: center;">
          <img src="${GARUDA_IMAGE_URL}" alt="ตราครุฑ" style="width: 60px; height: auto;" crossorigin="anonymous" />
        </div>
        <div style="flex: 1; text-align: right; font-size: 12px; border: 1px solid #000; padding: 8px;">
          <div style="font-weight: bold;">กองการบริหารงานบุคคล</div>
          <div>รับที่....................................</div>
          <div>วันที่....................................</div>
        </div>
      </div>

      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 24px; font-weight: bold;">ใบลาอุปสมบท</h2>
      </div>

      <div style="text-align: right; margin-bottom: 15px;">
        <div>(เขียนที่) ........................................................</div>
        <div style="margin-top: 5px;">วันที่ ${today.day} เดือน ${
    today.month
  } พ.ศ. ${today.year}</div>
      </div>

      <div style="margin-bottom: 10px;">
        <strong>เรื่อง</strong> ขอลาอุปสมบท
      </div>
      <div style="margin-bottom: 15px;">
        <strong>เรียน</strong> อธิการบดีมหาวิทยาลัยราชภัฏบุรีรัมย์
      </div>

      ${getEmployeeInfoHTML(userData)}

      <div style="margin: 15px 0; font-size: 14px;">
        <div>เกิดวันที่ .............................................. เข้ารับราชการเมื่อวันที่ ..............................................</div>
        <div style="margin-top: 10px;">
          ข้าพเจ้า <span style="margin: 0 15px;">☐ ยังไม่เคย</span> <span style="margin: 0 15px;">☐ เคย</span> อุปสมบท บัดนี้มีศรัทธาจะอุปสมบทในพระพุทธศาสนา
        </div>
        <div style="margin-top: 10px;">
          ณ วัด ............................................................................... ตั้งอยู่ ณ ...............................................................................
        </div>
        <div style="margin-top: 10px;">
          กำหนดอุปสมบทวันที่ ............................................... และจะจำพรรษาอยู่ ณ วัด ...............................................
        </div>
        <div style="margin-top: 10px;">
          ตั้งอยู่ ณ ...............................................................................
        </div>
        <div style="margin-top: 15px;">
          จึงขออนุญาตลาอุปสมบทตั้งแต่วันที่ <strong>${startDate.day} ${
    startDate.month
  } ${startDate.year}</strong>
          ถึงวันที่ <strong>${endDate.day} ${endDate.month} ${
    endDate.year
  }</strong>
          มีกำหนด <strong>${leaveData.totalDays || "......."}</strong> วัน
        </div>
      </div>

      <div style="text-align: right; margin: 30px 0;">
        <div>ลงชื่อ .............................................</div>
        <div style="margin-top: 5px;">(.............................................)</div>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 13px; margin-top: 30px;">
        <div style="width: 45%;">
          <div style="font-weight: bold;">๑. หัวหน้าสาขาวิชา/หัวหน้างานความเห็นของ<br>หัวหน้าสำนักงาน/หัวหน้าภาค/</div>
          <div style="margin-top: 30px;">........................................................</div>
          <div style="margin-top: 20px;">(ลงชื่อ).............................................<br>(.............................................)</div>
          
          <div style="font-weight: bold; margin-top: 30px;">๒. ความเห็นของคณบดี/ผอ.สำนัก/ผอ.สถาบัน</div>
          <div style="margin-top: 30px;">........................................................</div>
          <div style="margin-top: 20px;">(ลงชื่อ).............................................<br>(.............................................)</div>

          <div style="font-weight: bold; margin-top: 30px;">๕. คำสั่งอธิการบดีหรือผู้รักษาราชการแทน</div>
          <div style="margin: 10px 0;">
            <span style="margin-right: 30px;">☐ อนุญาต</span>
            <span>☐ ไม่อนุญาต</span>
          </div>
          <div style="margin-top: 15px;">(ลงชื่อ).............................................<br>(.............................................)</div>
          <div style="margin-top: 10px;">.................../....................../.................</div>
        </div>
        <div style="width: 45%;">
          <div style="font-weight: bold;">๓. ความเห็นผู้อำนวยการกองการบริหารงานบุคคล</div>
          <div style="margin-top: 30px;">........................................................</div>
          <div style="margin-top: 20px;">(ลงชื่อ).............................................<br>(.............................................)</div>

          <div style="font-weight: bold; margin-top: 30px;">๔. ความเห็นรองอธิการบดีฝ่ายบริหารงานบุคคล<br>และเทคโนโลยีสารสนเทศ</div>
          <div style="margin: 10px 0;">
            เห็นควร <span style="margin-right: 20px;">☐ อนุญาต</span> <span>☐ ไม่อนุญาต</span>
          </div>
          <div style="margin-top: 15px;">(ลงชื่อ).............................................<br>(.............................................)</div>
        </div>
      </div>

      <div style="margin-top: 30px; font-size: 12px; border-top: 1px solid #ccc; padding-top: 10px;">
        <strong>หมายเหตุ:</strong> การลงนามของผู้บังคับบัญชาตามลำดับชั้นให้ระบุ ชื่อ - สกุล ให้ครบถ้วน
      </div>
    </div>
  `;
};

/**
 * ฟอร์มทั่วไป (สำหรับประเภทลาอื่นๆ)
 */
const generateGenericForm = (
  leaveData,
  userData,
  today,
  startDate,
  endDate
) => {
  const leaveTypeName =
    LEAVE_TYPE_NAMES[leaveData.leaveType] || leaveData.leaveType;

  return `
    <div id="leave-form-pdf" style="
      width: 210mm;
      min-height: 297mm;
      padding: 15mm 20mm;
      font-family: 'TH Sarabun New', 'Sarabun', sans-serif;
      font-size: 14px;
      line-height: 1.5;
      background: white;
      color: black;
    ">
      ${getHeaderHTML("บันทึกข้อความ", `(หนังสือขออนุญาต${leaveTypeName})`)}
      ${getDepartmentHTML(userData, today, `ขออนุญาต${leaveTypeName}`)}
      ${getEmployeeInfoHTML(userData)}

      <div style="margin: 15px 0; font-size: 14px; text-indent: 50px;">
        มีความประสงค์ขออนุญาต<strong>${leaveTypeName}</strong>
      </div>

      <div style="margin: 10px 0; font-size: 14px;">
        <div>เนื่องจาก (เหตุผล) <strong>${
          leaveData.reason ||
          "............................................................................................."
        }</strong></div>
        <div style="margin-top: 10px;">
          ตั้งแต่วันที่ <strong>${startDate.day} ${startDate.month} ${
    startDate.year
  }</strong>
          <span style="margin-left: 20px;">ถึงวันที่ <strong>${endDate.day} ${
    endDate.month
  } ${endDate.year}</strong></span>
          <span style="margin-left: 20px;">มีกำหนด <strong>${
            leaveData.totalDays || "......."
          }</strong> วัน</span>
        </div>
        <div style="margin-top: 10px;">
          ในระหว่างลา จะติดต่อข้าพเจ้าได้ที่ ............................................................................................
        </div>
        <div style="margin-top: 15px; text-indent: 50px;">จึงเรียนมาเพื่อโปรดพิจารณา</div>
      </div>

      <div style="text-align: right; margin: 30px 0;">
        <div>ลงชื่อ .............................................</div>
        <div style="margin-top: 5px;">( ${userData.firstName || ""} ${
    userData.lastName || ""
  } )</div>
      </div>

      ${getSignatureHTML()}

      <div style="margin-top: 20px; font-size: 12px; border-top: 1px solid #ccc; padding-top: 10px;">
        <strong>หมายเหตุ:</strong> การลงนามของผู้บังคับบัญชาตามลำดับชั้นให้ระบุ ชื่อ - สกุล ให้ครบถ้วน
      </div>
    </div>
  `;
};

/**
 * สร้าง PDF ใบลาภาษาไทย - เลือก template ตามประเภทการลา
 */
export const generateLeavePDF = async (leaveData, userData) => {
  const startDate = formatThaiDate(leaveData.startDate);
  const endDate = formatThaiDate(leaveData.endDate);
  const today = formatThaiDate(new Date().toISOString());
  const leaveTypeName =
    LEAVE_TYPE_NAMES[leaveData.leaveType] || leaveData.leaveType;

  // เลือก template ตามประเภทการลา
  let htmlContent;
  switch (leaveData.leaveType) {
    case "sick":
    case "personal":
    case "maternity":
      htmlContent = generateSickPersonalMaternityForm(
        leaveData,
        userData,
        today,
        startDate,
        endDate
      );
      break;
    case "paternity":
      htmlContent = generatePaternityForm(
        leaveData,
        userData,
        today,
        startDate,
        endDate
      );
      break;
    case "vacation":
      htmlContent = generateVacationForm(
        leaveData,
        userData,
        today,
        startDate,
        endDate
      );
      break;
    case "ordination":
      htmlContent = generateOrdinationForm(
        leaveData,
        userData,
        today,
        startDate,
        endDate
      );
      break;
    default:
      htmlContent = generateGenericForm(
        leaveData,
        userData,
        today,
        startDate,
        endDate
      );
  }

  // สร้าง container ชั่วคราว
  const container = document.createElement("div");
  container.innerHTML = htmlContent;
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  document.body.appendChild(container);

  try {
    const element = container.querySelector("#leave-form-pdf");

    // แปลง HTML เป็น canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    // สร้าง PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    // บันทึกไฟล์
    const fileName = `ใบลา_${leaveTypeName}_${
      userData.firstName || ""
    }_${new Date().getTime()}.pdf`;
    pdf.save(fileName);

    return fileName;
  } finally {
    // ลบ container
    document.body.removeChild(container);
  }
};

export default generateLeavePDF;
