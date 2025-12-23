// components/admin/inquests/InquestsTable.tsx
"use client";

import { useTranslations } from "next-intl";
import { Inquest } from "./types";

type Props = {
  inquests: Inquest[];
  selectedInquest: Inquest | null;
  onSelectInquest: (i: Inquest) => void;
  onAddDecision: (i: Inquest) => void;
  onPreview: (i: Inquest) => void;
};

export function InquestsTable({
  inquests,
  selectedInquest,
  onSelectInquest,
  onAddDecision,
  onPreview,
}: Props) {
  const t = useTranslations("InquestsTable");

  return (
    <div className="lg:col-span-3 bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">
          {t("title", { count: inquests.length })}
        </h2>
        <p className="text-sm text-slate-500">
          {t("subtitle")}
        </p>
      </div>

      <div className="overflow-x-auto max-h-[600px]">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                {t("columns.date")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                {t("columns.teacher")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                {t("columns.type")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                {t("columns.reason")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                {t("columns.status")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                {t("columns.action")}
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-slate-200">
            {inquests.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-4 text-center text-sm text-slate-500"
                >
                  {t("empty")}
                </td>
              </tr>
            ) : (
              inquests.map((inquest) => (
                <tr
                  key={inquest.id}
                  onClick={() => onSelectInquest(inquest)}
                  className={`cursor-pointer hover:bg-teal-50 transition ${
                    selectedInquest?.id === inquest.id ? "bg-teal-100" : ""
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {new Date(inquest.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {inquest.teacher.name}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {t(`types.${inquest.inquestType}`)}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                    {inquest.reason}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        inquest.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : inquest.status === "RESPONDED"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {t(`statuses.${inquest.status}`)}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {inquest.status === "RESPONDED" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddDecision(inquest);
                        }}
                        className="text-teal-600 hover:text-teal-900"
                      >
                        {t("actions.addDecision")}
                      </button>
                    )}

                    {inquest.status === "COMPLETED" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreview(inquest);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {t("actions.preview")}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
