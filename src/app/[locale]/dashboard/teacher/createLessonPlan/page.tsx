// components/LessonPlanForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type ClassOption = { id: string; name: string };
type SubjectOption = { id: string; name: string };

const LessonPlanForm: React.FC = () => {
  const { data: session, status } = useSession();

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [formData, setFormData] = useState({
    teacherName: "",
    classId: "",
    grade: "",
    date: "",
    unit: "",
    lessonTopic: "",
    subjectId: "",                    // changed from subject string → subjectId
    studentOutcomes: "",
    vocabulary: "",
    materials: {
      text: false,
      textPage: "",
      board: false,
      overheadProjector: false,
      video: false,
      lab: false,
      website: "",
      studentBook: false,
      otherResources: "",
    },
    warmup: {
      questions: false,
      stories: false,
      revision: false,
      video: false,
      homework: false,
      description: "",
    },
    instructionalDelivery: {
      reading: false,
      discussion: false,
      problemSolving: false,
      criticalThinking: false,
      writing: false,
      individual: false,
      worksheets: false,
      groupWork: false,
      description: "",
    },
    procedures: {
      demonstration: false,
      lecture: false,
      qa: false,
      review: false,
      test: false,
      individual: false,
      brainstorming: false,
      problemSolving: false,
      cooperativeLearning: false,
      debating: false,
      learningByDoing: false,
      rolePlaying: false,
      description: "",
    },
    assessment: {
      testQuiz: false,
      homework: false,
      teacherObservation: false,
      project: false,
      revision: false,
      description: "",
    },
    closure: "",
    higherOrderThinking: "",
  });

  // Fetch teacher's classes & subjects
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const res = await fetch("/api/teacher-classes-subjects");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();

        setClasses(data.classes || []);
        setSubjects(data.subjects || []);
      } catch (err) {
        console.error(err);
        alert("Failed to load your classes and subjects.");
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [status, session]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (section: string, key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    setFormData((prev) => {
      const sectionData = prev[section as keyof typeof prev] as Record<string, any>;
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [key]: checked,
        },
      };
    });
  };

  const handleNestedInputChange = (section: string, key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { value } = e.target;
    setFormData((prev) => {
      const sectionData = prev[section as keyof typeof prev] as Record<string, any>;
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [key]: value,
        },
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.classId || !formData.subjectId) {
      alert("Please select Class and Subject");
      return;
    }

    try {
      const payload = {
        ...formData,
        teacherId: session?.user?.id,   // add teacherId for relation
      };

      const response = await fetch("/api/lesson-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Lesson plan saved successfully!");
      } else {
        alert("Failed to save lesson plan.");
      }
    } catch (error) {
      console.error("Error saving lesson plan:", error);
      alert("An error occurred.");
    }
  };

  if (status === "loading" || loadingOptions) return <div className="p-8 text-center">Loading...</div>;
  if (status !== "authenticated") return <div className="p-8 text-center">Please sign in.</div>;

  return (
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Daily Instructional Lesson Plan</h2>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Teacher Name</label>
          <input
            type="text"
            value={session?.user?.name || ""}
            disabled
            className="mt-1 block w-full border-gray-300 rounded-md bg-gray-100 shadow-sm sm:text-sm"
          />
        </div>

        {/* Class Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Class *</label>
          <select
            name="classId"
            value={formData.classId}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Select Class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Grade</label>
          <select
            name="grade"
            value={formData.grade}
            onChange={handleInputChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Select Grade</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="text"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            placeholder="18-22/1/2026"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Unit</label>
          <input
            type="text"
            name="unit"
            value={formData.unit}
            onChange={handleInputChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Lesson Topic</label>
          <input
            type="text"
            name="lessonTopic"
            value={formData.lessonTopic}
            onChange={handleInputChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        {/* Subject Select (dynamic) */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Subject *</label>
          <select
            name="subjectId"
            value={formData.subjectId}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Select Subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Outcomes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700">Student Outcomes</label>
        <textarea name="studentOutcomes" value={formData.studentOutcomes} onChange={handleInputChange} rows={4} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>

      {/* Vocabulary */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700">Vocabulary/Key Terms</label>
        <textarea name="vocabulary" value={formData.vocabulary} onChange={handleInputChange} rows={4} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>

      {/* Materials/Resources - full */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Materials/Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <input type="checkbox" checked={formData.materials.text} onChange={handleCheckboxChange("materials", "text")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
            <label className="ml-2">Text</label>
            <input type="text" value={formData.materials.textPage} onChange={handleNestedInputChange("materials", "textPage")} placeholder="P. ____ ___" className="ml-2 mt-0 block w-32 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div className="flex items-center"><input type="checkbox" checked={formData.materials.board} onChange={handleCheckboxChange("materials", "board")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Board</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.materials.overheadProjector} onChange={handleCheckboxChange("materials", "overheadProjector")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Overhead Projector</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.materials.video} onChange={handleCheckboxChange("materials", "video")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Video</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.materials.lab} onChange={handleCheckboxChange("materials", "lab")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Lab</label></div>
          <div className="flex items-center"><label className="mr-2">Website</label><input type="text" value={formData.materials.website} onChange={handleNestedInputChange("materials", "website")} className="mt-0 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" /></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.materials.studentBook} onChange={handleCheckboxChange("materials", "studentBook")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Student Book</label></div>
          <div className="flex items-center"><label className="mr-2">Other Resources</label><input type="text" value={formData.materials.otherResources} onChange={handleNestedInputChange("materials", "otherResources")} className="mt-0 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" /></div>
        </div>
      </div>

      {/* Warm-up/Introduction */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Warm-up/Introduction of the Lesson</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center"><input type="checkbox" checked={formData.warmup.questions} onChange={handleCheckboxChange("warmup", "questions")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Questions</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.warmup.stories} onChange={handleCheckboxChange("warmup", "stories")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Stories</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.warmup.revision} onChange={handleCheckboxChange("warmup", "revision")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Revision for Previous</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.warmup.video} onChange={handleCheckboxChange("warmup", "video")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Video</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.warmup.homework} onChange={handleCheckboxChange("warmup", "homework")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Checking the Homework</label></div>
        </div>
        <textarea value={formData.warmup.description} onChange={handleNestedInputChange("warmup", "description")} rows={4} placeholder="Description..." className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>

      {/* Instructional Delivery */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Instructional Delivery</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center"><input type="checkbox" checked={formData.instructionalDelivery.reading} onChange={handleCheckboxChange("instructionalDelivery", "reading")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Reading</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.instructionalDelivery.discussion} onChange={handleCheckboxChange("instructionalDelivery", "discussion")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Discussion</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.instructionalDelivery.problemSolving} onChange={handleCheckboxChange("instructionalDelivery", "problemSolving")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Problem Solving</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.instructionalDelivery.criticalThinking} onChange={handleCheckboxChange("instructionalDelivery", "criticalThinking")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Critical Thinking</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.instructionalDelivery.writing} onChange={handleCheckboxChange("instructionalDelivery", "writing")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Writing</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.instructionalDelivery.individual} onChange={handleCheckboxChange("instructionalDelivery", "individual")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Individual</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.instructionalDelivery.worksheets} onChange={handleCheckboxChange("instructionalDelivery", "worksheets")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Worksheets</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.instructionalDelivery.groupWork} onChange={handleCheckboxChange("instructionalDelivery", "groupWork")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Group Work</label></div>
        </div>
        <textarea value={formData.instructionalDelivery.description} onChange={handleNestedInputChange("instructionalDelivery", "description")} rows={4} placeholder="Description..." className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>

      {/* Procedures/Teaching Method */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Procedures/Teaching Method or Skills</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center"><input type="checkbox" checked={formData.procedures.demonstration} onChange={handleCheckboxChange("procedures", "demonstration")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Demonstration</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.procedures.lecture} onChange={handleCheckboxChange("procedures", "lecture")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Lecture</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.procedures.qa} onChange={handleCheckboxChange("procedures", "qa")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Q & A</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.procedures.review} onChange={handleCheckboxChange("procedures", "review")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Review</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.procedures.test} onChange={handleCheckboxChange("procedures", "test")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Test</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.procedures.individual} onChange={handleCheckboxChange("procedures", "individual")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Individual</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.procedures.brainstorming} onChange={handleCheckboxChange("procedures", "brainstorming")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Brainstorming</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.procedures.problemSolving} onChange={handleCheckboxChange("procedures", "problemSolving")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Problem Solving</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.procedures.cooperativeLearning} onChange={handleCheckboxChange("procedures", "cooperativeLearning")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Cooperative Learning</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.procedures.debating} onChange={handleCheckboxChange("procedures", "debating")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Debating</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.procedures.learningByDoing} onChange={handleCheckboxChange("procedures", "learningByDoing")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Learning by Doing</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.procedures.rolePlaying} onChange={handleCheckboxChange("procedures", "rolePlaying")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Role Playing</label></div>
        </div>
        <textarea value={formData.procedures.description} onChange={handleNestedInputChange("procedures", "description")} rows={4} placeholder="Description..." className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>

      {/* Assessment/Evaluation */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Assessment/Evaluation (Formative/Summative)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center"><input type="checkbox" checked={formData.assessment.testQuiz} onChange={handleCheckboxChange("assessment", "testQuiz")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Test / Quiz</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.assessment.homework} onChange={handleCheckboxChange("assessment", "homework")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Homework</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.assessment.teacherObservation} onChange={handleCheckboxChange("assessment", "teacherObservation")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Teacher Observation</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.assessment.project} onChange={handleCheckboxChange("assessment", "project")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Project</label></div>
          <div className="flex items-center"><input type="checkbox" checked={formData.assessment.revision} onChange={handleCheckboxChange("assessment", "revision")} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2">Revision</label></div>
        </div>
        <textarea value={formData.assessment.description} onChange={handleNestedInputChange("assessment", "description")} rows={4} placeholder="Description..." className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>

      {/* Closure */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700">Closure: What have you learned?/ What might happen next? / How is the lesson related to real life?</label>
        <textarea name="closure" value={formData.closure} onChange={handleInputChange} rows={4} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>

      {/* Higher Order Thinking Skills */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700">Higher Order Thinking Skills</label>
        <textarea name="higherOrderThinking" value={formData.higherOrderThinking} onChange={handleInputChange} rows={4} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>

      <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
        Save Lesson Plan
      </button>
    </form>
  );
};

export default LessonPlanForm;