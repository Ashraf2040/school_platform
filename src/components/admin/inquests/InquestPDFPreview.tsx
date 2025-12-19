// components/admin/inquests/InquestPDFPreview.tsx
import { Inquest } from "./types";

type Props = {
  inquest: Inquest;
  generatingPDF: boolean;
  onClose: () => void;
  onDownload: () => void;
};

export function InquestPDFPreview({ inquest, generatingPDF, onClose, onDownload }: Props) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-900">PDF Preview</h2>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-gray-700 transition"
          >
            Close
          </button>
          <button
            onClick={onDownload}
            disabled={generatingPDF}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-60 transition"
          >
            {generatingPDF ? "Generating..." : "Download"}
          </button>
        </div>
      </div>

      <div
        id="pdf-preview-template"
        className="bg-white p-10 border border-gray-300 shadow-lg"
        style={{
          width: "280mm",
          minHeight: "297mm",
          margin: "0 auto",
          fontFamily: "'Amiri', 'Noto Sans Arabic', Arial, sans-serif",
          fontSize: "12px",
          lineHeight: "1.6",
          direction: "rtl",
          color: "#1a1a1a",
        }}
      >
        {/* Enhanced Header */}
        <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "20px", borderBottom: "3px solid #0891b2", paddingBottom: "10px", marginBottom: "20px", color: "#0891b2" }}>
          AL FORQAN PRIVATE SCHOOL- AMERICAN DIVISION
        </div>
        <div style={{ textAlign: "center", fontSize: "16px", marginBottom: "10px", fontWeight: "600", color: "#0e7490" }}>
          Academic Year {inquest.academicYear.name}
        </div>
       <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "28px", marginBottom: "30px", color: "#0891b2" }}>
    Inquest مسائلة
  </div>

        {/* Teacher Info Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "25px" }}>
          <tbody>
            <tr>
              <td style={{ border: "2px solid #0891b2", padding: "10px", fontWeight: "bold", width: "15%", backgroundColor: "#cffafe", textAlign: "center" }}>الاسم<br/>Name</td>
              <td style={{ border: "2px solid #0891b2", padding: "10px", width: "35%" }}>{inquest.teacher.name}</td>
              <td style={{ border: "2px solid #0891b2", padding: "10px", fontWeight: "bold", width: "15%", backgroundColor: "#cffafe", textAlign: "center" }}>الوظيفة<br/>Job</td>
              <td style={{ border: "2px solid #0891b2", padding: "10px", width: "35%" }}>
                {inquest.teacherJobTitle || "غير محدد"}
              </td>
            </tr>
            <tr>
              <td style={{ border: "2px solid #0891b2", padding: "10px", fontWeight: "bold", backgroundColor: "#cffafe", textAlign: "center" }}>التخصص<br/>Specialty</td>
              <td style={{ border: "2px solid #0891b2", padding: "10px" }}>
                {inquest.teacherSpecialty || "غير محدد"}
              </td>
              <td style={{ border: "2px solid #0891b2", padding: "10px", fontWeight: "bold", backgroundColor: "#cffafe", textAlign: "center" }}>التاريخ<br/>Date</td>
              <td style={{ border: "2px solid #0891b2", padding: "10px" }}>
                {new Date(inquest.createdAt).toLocaleDateString("en-GB")}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section 1: Clarification Request */}
        <div style={{ border: "3px solid #0891b2", marginBottom: "25px", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)", color: "white", padding: "12px", fontWeight: "bold", fontSize: "18px", textAlign: "center" }}>
            1- Clarification Request / طلب إيضاح
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ width: "50%", padding: "10px", verticalAlign: "top", borderRight: "1px solid #047857" }}>
                  <p>Venerable / {inquest.teacher.name}</p>
                  <p>The follow up reveals that:</p>
                  <div style={{ minHeight: "120px", border: "1px dashed #ccc", padding: "5px", marginTop: "5px", backgroundColor: "#f9f9f9" }}>
                    {inquest.reason && <div><strong>Reason:</strong> {inquest.reason.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>}
                    {inquest.details && <div><strong>Details:</strong> {inquest.details.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>}
                    {inquest.clarificationRequest && <div><strong>Request:</strong> {inquest.clarificationRequest.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>}
                  </div>
                </td>
                <td style={{ width: "50%", padding: "10px", direction: "rtl", verticalAlign: "top" }}>
                  <p>المكرم / {inquest.teacher.name}</p>
                  <p>من خلال المتابعة :</p>
                  <div style={{ minHeight: "120px", border: "1px dashed #ccc", padding: "5px", marginTop: "5px", backgroundColor: "#f9f9f9" }}>
                    {inquest.reason && <div><strong>السبب:</strong> {inquest.reason.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>}
                    {inquest.details && <div><strong>التفاصيل:</strong> {inquest.details.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>}
                    {inquest.clarificationRequest && <div><strong>طلب التوضيح:</strong> {inquest.clarificationRequest.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Teacher Clarification */}
        <div style={{ border: "3px solid #10b981", marginBottom: "25px", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white", padding: "12px", fontWeight: "bold", fontSize: "18px", textAlign: "center" }}>
            2- Clarification / الإيضاح
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ width: "50%", padding: "15px", verticalAlign: "top", borderRight: "2px solid #10b981" }}>
                  <div className="flex justify-between items-center">
                    <p>Venerable Principal /</p>
                    <p>Greetings</p>
                  </div>
                  <div style={{ 
                    minHeight: inquest.teacherClarification ? `${Math.max(80, inquest.teacherClarification.length / 3)}px` : "80px", 
                    border: "2px solid #d1fae5", 
                    padding: "10px", 
                    marginTop: "8px", 
                    backgroundColor: "#f0fdf4",
                    borderRadius: "4px"
                  }}>
                    {inquest.teacherClarification?.split('\n').map((line, i) => <div key={i} style={{ marginBottom: "4px" }}>{line}</div>)}
                  </div>
                  <p style={{ marginTop: "10px" }}>Name: {inquest.teacher.name}</p>
                  <p>Signature: ......................... </p>
                  <p>Date: __ / __ / {new Date(inquest.createdAt).getFullYear()}</p>
                </td>
                <td style={{ width: "50%", padding: "15px", direction: "rtl", verticalAlign: "top" }}>
                  <div className="flex justify-between items-center">
                    <p>المكرم قائد المدرسة /</p>
                    <p>تحية طيبة وبعد</p>
                  </div>
                  <div style={{ 
                    minHeight: inquest.teacherClarification ? `${Math.max(80, inquest.teacherClarification.length / 3)}px` : "80px", 
                    border: "2px solid #d1fae5", 
                    padding: "10px", 
                    marginTop: "8px", 
                    backgroundColor: "#f0fdf4",
                    borderRadius: "4px"
                  }}>
                    {inquest.teacherClarification?.split('\n').map((line, i) => <div key={i} style={{ marginBottom: "4px" }}>{line}</div>)}
                  </div>
                  <p style={{ marginTop: "10px" }}>الاسم: {inquest.teacher.name}</p>
                  <p>التوقيع: ......................... </p>
                  <p>التاريخ: {new Date(inquest.createdAt).getFullYear()} / __ / __</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3: Principal's Opinion and Decision */}
        <div style={{ border: "3px solid #f59e0b", marginBottom: "25px", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "white", padding: "12px", fontWeight: "bold", fontSize: "18px", textAlign: "center" }}>
            3- Principal's Opinion and Decision / رأي وقرار قائد المدرسة
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ width: "50%", padding: "15px", verticalAlign: "top", borderRight: "2px solid #f59e0b" }}>
                  <p style={{ fontWeight: "bold", marginBottom: "10px", fontSize: "14px" }}>Principal's Opinion:</p>
                  {inquest.principalOpinion && (
                    <div style={{ 
                      backgroundColor: "#fef3c7", 
                      border: "2px solid #fbbf24", 
                      padding: "12px", 
                      borderRadius: "6px",
                      marginBottom: "15px",
                      fontWeight: "600",
                      fontSize: "13px"
                    }}>
                      ☑ {inquest.principalOpinion}
                    </div>
                  )}
                  <p style={{ fontWeight: "bold", marginTop: "15px", fontSize: "14px" }}>Final Decision:</p>
                  <div style={{ 
                    backgroundColor: "#fffbeb", 
                    border: "2px solid #fbbf24", 
                    padding: "12px", 
                    borderRadius: "6px",
                    marginTop: "8px",
                    minHeight: "60px"
                  }}>
                    {inquest.decisionText || ""}
                  </div>
                  <p style={{ marginTop: "20px", fontWeight: "600" }}>Principal: Mr. Abdellah Shaker Alghamdi</p>
                  <p>Signature: ......................... </p>
                  <p>Date: __ / __ / {new Date(inquest.createdAt).getFullYear()}</p>
                </td>
                <td style={{ width: "50%", padding: "15px", direction: "rtl", verticalAlign: "top" }}>
                  <p style={{ fontWeight: "bold", marginBottom: "10px", fontSize: "14px" }}>رأي قائد المدرسة:</p>
                  {inquest.principalOpinion && (
                    <div style={{ 
                      backgroundColor: "#fef3c7", 
                      border: "2px solid #fbbf24", 
                      padding: "12px", 
                      borderRadius: "6px",
                      marginBottom: "15px",
                      fontWeight: "600",
                      fontSize: "13px"
                    }}>
                      ☑ {inquest.principalOpinion}
                    </div>
                  )}
                  <p style={{ fontWeight: "bold", marginTop: "15px", fontSize: "14px" }}>القرار النهائي:</p>
                  <div style={{ 
                    backgroundColor: "#fffbeb", 
                    border: "2px solid #fbbf24", 
                    padding: "12px", 
                    borderRadius: "6px",
                    marginTop: "8px",
                    minHeight: "60px"
                  }}>
                    {inquest.decisionText || ""}
                  </div>
                  <p style={{ marginTop: "20px", fontWeight: "600" }}>قائد المدرسة : أ/ عبد الله شاكر الغامدي</p>
                  <p>التوقيع: ......................... </p>
                  <p>التاريخ: {new Date(inquest.createdAt).getFullYear()} / __ / __</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Draw Attention Section */}
        {inquest.drawAttentionText && (
          <div style={{ 
            border: "4px double #dc2626", 
            margin: "30px 0", 
            padding: "20px", 
            borderRadius: "12px", 
            backgroundColor: "#fef2f2" 
          }}>
            <div style={{ textAlign: "center", fontSize: "20px", fontWeight: "bold", color: "#dc2626", marginBottom: "15px" }}>
              لفت نظر - Draw Attention
            </div>
            <div style={{ 
              whiteSpace: "pre-line", 
              fontSize: "14px", 
              lineHeight: "2", 
              textAlign: "right", 
              direction: "rtl" 
            }}>
              {inquest.drawAttentionText}
            </div>
            <div style={{ marginTop: "30px", display: "flex", justifyContent: "space-between" }}>
              <div style={{ textAlign: "center" }}>
                <p>توقيع المعلم</p>
                <div style={{ borderTop: "1px solid #000", width: "200px", margin: "20px auto 0" }}></div>
              </div>
              <div style={{ textAlign: "center" }}>
                <p>توقيع المدير</p>
                <div style={{ borderTop: "1px solid #000", width: "200px", margin: "20px auto 0" }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}