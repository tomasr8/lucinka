import { useState } from "react";
import {
  Calendar,
  Weight,
  Ruler,
  FileText,
  Plus,
  X,
  CheckCircle,
} from "lucide-react";

export default function FormModal({ onSubmit }) {
  const [isOpen, setIsOpen] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    weight: "",
    height: "",
    notes: "",
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    // Submit form data
    const data = { ...formData };
    if (data.weight === "") delete data.weight;
    if (data.height === "") delete data.height;
    fetch("/api/data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then(() => {
        // Clear form and close modal after successful submission
        setFormData({ date: "", weight: "", height: "", notes: "" });
        setIsOpen(false);
        // Show success flag
        setShowSuccess(true);
        // Hide success flag after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      })
      .catch(error => {
        console.error("Error submitting form:", error);
      })
      .then(() => {
        fetch("/api/data")
          .then(response => response.json())
          .then(() => {
            onSubmit();
          });
      });
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <div>
      {/* Success Flag Notification */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
            <CheckCircle className="w-6 h-6" />
            <div>
              <p className="font-semibold">Success!</p>
              <p className="text-sm">Health entry added successfully</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={closeModal}
        >
          {/* Modal Content */}
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Health Entry
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Track your daily health metrics
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="date"
                    className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
                  >
                    <Calendar className="w-4 h-4 text-teal-600" />
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="weight"
                    className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
                  >
                    <Weight className="w-4 h-4 text-teal-600" />
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    id="weight"
                    name="weight"
                    placeholder="Enter your weight"
                    value={formData.weight}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="height"
                    className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
                  >
                    <Ruler className="w-4 h-4 text-teal-600" />
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    id="height"
                    name="height"
                    placeholder="Enter your height"
                    value={formData.height}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="notes"
                    className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
                  >
                    <FileText className="w-4 h-4 text-teal-600" />
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows="4"
                    placeholder="Add any additional notes..."
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={closeModal}
                className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// import { useState, useEffect } from "react";
// import { Calendar, Weight, Ruler, FileText, Plus } from "lucide-react";

// export default function Form() {
//     const [formData, setFormData] = useState({
//         date: "",
//         weight: "",
//         height: "",
//         notes: "",
//     });
//   const [showSuccess, setShowSuccess] = useState(false);

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setFormData((prev) => ({ ...prev, [name]: value }));
//     };

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         // Submit form data
//         fetch("/api/data", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify(formData),
//         });
//     };

//       return (
//     <div className="max-w-2xl mx-auto p-6">
//       <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
//         <div className="mb-6">
//           <h2 className="text-2xl font-bold text-gray-800 mb-2">Health Entry</h2>
//         </div>

//         <div className="space-y-5">
//           <div>
//             <label htmlFor="date" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
//               <Calendar className="w-4 h-4 text-teal-600" />
//               Date
//             </label>
//             <input
//               type="date"
//               id="date"
//               name="date"
//               required
//               value={formData.date}
//               onChange={handleChange}
//               className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
//             />
//           </div>

//           <div>
//             <label htmlFor="weight" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
//               <Weight className="w-4 h-4 text-teal-600" />
//               Weight (kg)
//             </label>
//             <input
//               type="number"
//               id="weight"
//               name="weight"
//               placeholder="Enter your weight"
//               value={formData.weight}
//               onChange={handleChange}
//               className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
//             />
//           </div>

//           <div>
//             <label htmlFor="height" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
//               <Ruler className="w-4 h-4 text-teal-600" />
//               Height (cm)
//             </label>
//             <input
//               type="number"
//               id="height"
//               name="height"
//               placeholder="Enter your height"
//               value={formData.height}
//               onChange={handleChange}
//               className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
//             />
//           </div>

//           <div>
//             <label htmlFor="notes" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
//               <FileText className="w-4 h-4 text-teal-600" />
//               Notes
//             </label>
//             <textarea
//               id="notes"
//               name="notes"
//               rows="4"
//               placeholder="Add any additional notes..."
//               value={formData.notes}
//               onChange={handleChange}
//               className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white resize-none"
//             ></textarea>
//           </div>

//           <button
//             type="submit"
//             onClick={handleSubmit}
//             className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
//           >
//             <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
//             Add Entry
//           </button>
//         </div>
//       </div>
//     </div>
//   );

// }
