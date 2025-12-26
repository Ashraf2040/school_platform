// components/admin/inquests/InquestPDFPreview.tsx
import { Inquest } from "./types";
import { useState } from "react";

type Props = {
  inquest: Inquest;
  generatingPDF: boolean;
  onClose: () => void;
  onDownload: () => void;
};

type LanguageView = 'Both' | 'Arabic' | 'English';

// Helper function to get the appropriate title based on the selected view
const getTitle = (english: string, arabic: string, view: LanguageView) => {
  if (view === 'Arabic') return arabic;
  if (view === 'English') return english;
  return `${english} / ${arabic}`;
};

// Helper function to get the appropriate table header content based on the selected view
const getTableHeader = (english: string, arabic: string, view: LanguageView) => {
  if (view === 'Arabic') return arabic;
  if (view === 'English') return english;
  return `${arabic}<br/>${english}`;
};

export function InquestPDFPreview({ inquest, generatingPDF, onClose, onDownload }: Props) {
  const [languageView, setLanguageView] = useState<LanguageView>('Both');

  const isArabicOnly = languageView === 'Arabic';
  const isEnglishOnly = languageView === 'English';
  const isBoth = languageView === 'Both';

  const showEnglish = isBoth || isEnglishOnly;
  const showArabic = isBoth || isArabicOnly;

  const fullWidthStyle = { width: "100%" };
  const halfWidthStyle = { width: "50%" };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-semibold text-slate-900">PDF Preview</h2>
        <div className="flex flex-wrap items-center gap-5">
          {/* Language Select Box */}
          <div className="flex items-center gap-2">
            <label htmlFor="language-select" className="text-sm font-medium text-slate-700">View:</label>
            <select
              id="language-select"
              value={languageView}
              onChange={(e) => setLanguageView(e.target.value as LanguageView)}
              className="rounded-lg border border-gray-300 px-3 py-1 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="Both">Both</option>
              <option value="Arabic">Arabic</option>
              <option value="English">English</option>
            </select>
          </div>
          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
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
      </div>

      <div
        id="pdf-preview-template"
        className="bg-white p-10 border border-gray-300 shadow-lg"
        style={{
          width: "280mm",
          minHeight: "297mm",
          margin: "0 auto",
          fontFamily: "'Amiri', 'Noto Sans Arabic', Arial, sans-serif",
          fontSize: "14px", // Increased font size
          lineHeight: "1.6",
          direction: isArabicOnly ? "rtl" : "ltr", // Conditional direction
          color: "#1F2937", // Darker text color
        }}
      >
        {/* Enhanced Header - Excluded from language filtering as requested */}
        <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "22px", borderBottom: "2px solid #1E3A8A", paddingBottom: "15px", marginBottom: "25px", color: "#1E3A8A" }}>
          AL FORQAN PRIVATE SCHOOL- AMERICAN DIVISION
        </div>
        <div style={{ textAlign: "center", fontSize: "18px", marginBottom: "15px", fontWeight: "600", color: "#374151" }}>
          Academic Year {inquest.academicYear.name}
        </div>
       <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "32px", marginBottom: "40px", color: "#1E3A8A" }}>
          {getTitle("Inquest", "مساءلة", languageView)}
        </div>

        {/* Teacher Info Table - Headers are conditional */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px", border: "1px solid #D1D5DB" }}>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #D1D5DB", padding: "12px", fontWeight: "bold", width: "15%", backgroundColor: "#F1F5F9", textAlign: "center", color: "#1E3A8A" }} dangerouslySetInnerHTML={{ __html: getTableHeader("Name", "الاسم", languageView) }}></td>
              <td style={{ border: "1px solid #D1D5DB", padding: "12px", width: "35%" }}>{inquest.teacher.name}</td>
              <td style={{ border: "1px solid #D1D5DB", padding: "12px", fontWeight: "bold", width: "15%", backgroundColor: "#F1F5F9", textAlign: "center", color: "#1E3A8A" }} dangerouslySetInnerHTML={{ __html: getTableHeader("Job", "الوظيفة", languageView) }}></td>
              <td style={{ border: "1px solid #D1D5DB", padding: "12px", width: "35%" }}>
                {inquest.teacherJobTitle || "غير محدد"}
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #D1D5DB", padding: "12px", fontWeight: "bold", backgroundColor: "#F1F5F9", textAlign: "center", color: "#1E3A8A" }} dangerouslySetInnerHTML={{ __html: getTableHeader("Specialty", "التخصص", languageView) }}></td>
              <td style={{ border: "1px solid #D1D5DB", padding: "12px" }}>
                {inquest.teacherSpecialty || "غير محدد"}
              </td>
              <td style={{ border: "1px solid #D1D5DB", padding: "12px", fontWeight: "bold", backgroundColor: "#F1F5F9", textAlign: "center", color: "#1E3A8A" }} dangerouslySetInnerHTML={{ __html: getTableHeader("Date", "التاريخ", languageView) }}></td>
              <td style={{ border: "1px solid #D1D5DB", padding: "12px" }}>
                {new Date(inquest.createdAt).toLocaleDateString("en-GB")}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section 1: Clarification Request */}
        <div style={{ border: "1px solid #1E3A8A", marginBottom: "30px", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ background: "#1E3A8A", color: "white", padding: "15px", fontWeight: "bold", fontSize: "18px", textAlign: "center" }}>
            {getTitle("1- Clarification Request", "1- طلب إيضاح", languageView)}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                {showEnglish && (
                  <td style={{ 
                    ...(isBoth ? halfWidthStyle : fullWidthStyle), 
                    padding: "15px", 
                    verticalAlign: "top", 
                    borderRight: showArabic ? "1px solid #D1D5DB" : "none",
                    direction: "ltr" // Ensure English side is LTR
                  }}>
                    <p style={{ marginBottom: "10px", fontWeight: "600" }}>Venerable / {inquest.teacher.name}</p>
                    <p style={{ marginBottom: "10px" }}>The follow up reveals that:</p>
                    <div style={{ minHeight: "150px", border: "1px solid #D1D5DB", padding: "10px", marginTop: "10px", backgroundColor: "#F9FAFB", borderRadius: "4px" }}>
                      {inquest.reason && <div style={{ marginBottom: "8px" }}><strong>Reason:</strong> {inquest.reason.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>}
                      {inquest.details && <div style={{ marginBottom: "8px" }}><strong>Details:</strong> {inquest.details.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>}
                      {inquest.clarificationRequest && <div><strong>Request:</strong> {inquest.clarificationRequest.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>}
                    </div>
                  </td>
                )}
                {showArabic && (
                  <td style={{ 
                    ...(isBoth ? halfWidthStyle : fullWidthStyle), 
                    padding: "15px", 
                    direction: "rtl", 
                    verticalAlign: "top" 
                  }}>
                    <p style={{ marginBottom: "10px", fontWeight: "600" }}>المكرم / {inquest.teacher.name}</p>
                    <p style={{ marginBottom: "10px" }}>من خلال المتابعة :</p>
                    <div style={{ minHeight: "150px", border: "1px solid #D1D5DB", padding: "10px", marginTop: "10px", backgroundColor: "#F9FAFB", borderRadius: "4px" }}>
                      {inquest.reason && <div style={{ marginBottom: "8px" }}><strong>السبب:</strong> {inquest.reason.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>}
                      {inquest.details && <div style={{ marginBottom: "8px" }}><strong>التفاصيل:</strong> {inquest.details.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>}
                      {inquest.clarificationRequest && <div><strong>طلب التوضيح:</strong> {inquest.clarificationRequest.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>}
                    </div>
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Teacher Clarification */}
        <div style={{ border: "1px solid #059669", marginBottom: "30px", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ background: "#059669", color: "white", padding: "15px", fontWeight: "bold", fontSize: "18px", textAlign: "center" }}>
            {getTitle("2- Clarification", "2- الإيضاح", languageView)}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                {showEnglish && (
                  <td style={{ 
                    ...(isBoth ? halfWidthStyle : fullWidthStyle), 
                    padding: "15px", 
                    verticalAlign: "top", 
                    borderRight: showArabic ? "1px solid #D1D5DB" : "none",
                    direction: "ltr" // Ensure English side is LTR
                  }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: "10px" }}>
                      <p>Venerable Principal /</p>
                      <p>Greetings</p>
                    </div>
                    <div style={{ 
                      minHeight: inquest.teacherClarification ? `${Math.max(100, inquest.teacherClarification.length / 3)}px` : "100px", 
                      border: "1px solid #D1D5DB", 
                      padding: "12px", 
                      marginTop: "8px", 
                      backgroundColor: "#ECFDF5", // Light green background
                      borderRadius: "4px"
                    }}>
                      {inquest.teacherClarification?.split('\n').map((line, i) => <div key={i} style={{ marginBottom: "4px" }}>{line}</div>)}
                    </div>
                    <p style={{ marginTop: "15px" }}>Name: {inquest.teacher.name}</p>
                    <p>Signature: ......................... </p>
                    <p>Date: __ / __ / {new Date(inquest.createdAt).getFullYear()}</p>
                  </td>
                )}
                {showArabic && (
                  <td style={{ 
                    ...(isBoth ? halfWidthStyle : fullWidthStyle), 
                    padding: "15px", 
                    direction: "rtl", 
                    verticalAlign: "top" 
                  }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: "10px" }}>
                      <p>المكرم قائد المدرسة /</p>
                      <p>تحية طيبة وبعد</p>
                    </div>
                    <div style={{ 
                      minHeight: inquest.teacherClarification ? `${Math.max(100, inquest.teacherClarification.length / 3)}px` : "100px", 
                      border: "1px solid #D1D5DB", 
                      padding: "12px", 
                      marginTop: "8px", 
                      backgroundColor: "#ECFDF5", // Light green background
                      borderRadius: "4px"
                    }}>
                      {inquest.teacherClarification?.split('\n').map((line, i) => <div key={i} style={{ marginBottom: "4px" }}>{line}</div>)}
                    </div>
                    <p style={{ marginTop: "15px" }}>الاسم: {inquest.teacher.name}</p>
                    <p>التوقيع: ......................... </p>
                    <p>التاريخ: {new Date(inquest.createdAt).getFullYear()} / __ / __</p>
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3: Principal's Opinion and Decision */}
        <div style={{ border: "1px solid #D97706", marginBottom: "30px", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ background: "#D97706", color: "white", padding: "15px", fontWeight: "bold", fontSize: "18px", textAlign: "center" }}>
            {getTitle("3- Principal's Opinion and Decision", "3- رأي وقرار قائد المدرسة", languageView)}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                {showEnglish && (
                  <td style={{ 
                    ...(isBoth ? halfWidthStyle : fullWidthStyle), 
                    padding: "15px", 
                    verticalAlign: "top", 
                    borderRight: showArabic ? "1px solid #D1D5DB" : "none",
                    direction: "ltr" // Ensure English side is LTR
                  }}>
                    <p style={{ fontWeight: "bold", marginBottom: "10px", fontSize: "16px", color: "#D97706" }}>Principal's Opinion:</p>
                    {inquest.principalOpinion && (
                      <div style={{ 
                        backgroundColor: "#FFFBEB", // Light yellow background
                        border: "1px solid #FBBF24", 
                        padding: "12px", 
                        borderRadius: "6px",
                        marginBottom: "15px",
                        fontWeight: "600",
                        fontSize: "14px"
                      }}>
                        ☑ {inquest.principalOpinion}
                      </div>
                    )}
                    <p style={{ fontWeight: "bold", marginTop: "15px", fontSize: "16px", color: "#D97706" }}>Final Decision:</p>
                    <div style={{ 
                      backgroundColor: "#FFFBEB", 
                      border: "1px solid #FBBF24", 
                      padding: "12px", 
                      borderRadius: "6px",
                      marginTop: "8px",
                      minHeight: "80px"
                    }}>
                      {inquest.decisionText || ""}
                    </div>
                    <p style={{ marginTop: "25px", fontWeight: "700" }}>Principal: Mr. Abdellah Shaker Alghamdi</p>
                    <p>Signature: ......................... </p>
                    <p>Date: __ / __ / {new Date(inquest.createdAt).getFullYear()}</p>
                  </td>
                )}
                {showArabic && (
                  <td style={{ 
                    ...(isBoth ? halfWidthStyle : fullWidthStyle), 
                    padding: "15px", 
                    direction: "rtl", 
                    verticalAlign: "top" 
                  }}>
                    <p style={{ fontWeight: "bold", marginBottom: "10px", fontSize: "16px", color: "#D97706" }}>رأي قائد المدرسة:</p>
                    {inquest.principalOpinion && (
                      <div style={{ 
                        backgroundColor: "#FFFBEB", 
                        border: "1px solid #FBBF24", 
                        padding: "12px", 
                        borderRadius: "6px",
                        marginBottom: "15px",
                        fontWeight: "600",
                        fontSize: "14px"
                      }}>
                        ☑ {inquest.principalOpinion}
                      </div>
                    )}
                    <p style={{ fontWeight: "bold", marginTop: "15px", fontSize: "16px", color: "#D97706" }}>القرار النهائي:</p>
                    <div style={{ 
                      backgroundColor: "#FFFBEB", 
                      border: "1px solid #FBBF24", 
                      padding: "12px", 
                      borderRadius: "6px",
                      marginTop: "8px",
                      minHeight: "80px"
                    }}>
                      {inquest.decisionText || ""}
                    </div>
                    <p style={{ marginTop: "25px", fontWeight: "700" }}>قائد المدرسة : أ/ عبد الله شاكر الغامدي</p>
                    <p>التوقيع: ......................... </p>
                    <p>التاريخ: {new Date(inquest.createdAt).getFullYear()} / __ / __</p>
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Draw Attention Section - Title and Signatures are conditional */}
        {inquest.drawAttentionText && (
          <div style={{ 
            border: "2px solid #DC2626", // Solid red border
            margin: "35px 0", 
            padding: "25px", 
            borderRadius: "12px", 
            backgroundColor: "#FEF2F2" // Very light red background
          }}>
            <div style={{ textAlign: "center", fontSize: "22px", fontWeight: "bold", color: "#DC2626", marginBottom: "20px", borderBottom: "1px dashed #DC2626", paddingBottom: "10px" }}>
              {getTitle("Draw Attention", "لفت نظر", languageView)}
            </div>
            <div style={{ 
              whiteSpace: "pre-line", 
              fontSize: "15px", 
              lineHeight: "1.8", 
              textAlign: isEnglishOnly ? "left" : "right", 
              direction: isEnglishOnly ? "ltr" : "rtl",
              padding: "10px"
            }}>
              {inquest.drawAttentionText}
            </div>
            <div style={{ marginTop: "40px", display: "flex", justifyContent: "space-around" }}>
              <div style={{ textAlign: "center", width: "40%" }}>
                <p style={{ marginBottom: "5px", fontWeight: "600" }}>{isEnglishOnly ? "Teacher Signature" : "توقيع المعلم"}</p>
                <div style={{ borderTop: "1px solid #000", width: "100%", margin: "15px auto 0" }}></div>
              </div>
              <div style={{ textAlign: "center", width: "40%" }}>
                <p style={{ marginBottom: "5px", fontWeight: "600" }}>{isEnglishOnly ? "Principal Signature" : "توقيع المدير"}</p>
                <div style={{ borderTop: "1px solid #000", width: "100%", margin: "15px auto 0" }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
