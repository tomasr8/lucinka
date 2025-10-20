import { useState, useEffect } from "react";



export default function Form() {
    const [formData, setFormData] = useState({
        date: "",
        weight: "",
        height: "",
        notes: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Submit form data
        fetch("/api/data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
        });
    };

    return (
        <div className="p-4 mb-4 border border-gray-300 rounded-lg bg-white shadow-md">
            <form onSubmit={handleSubmit}>
                <div class="mt-2">
                    <label for="date" class="block text-sm/6 font-medium text-gray-900">Date</label>
                    <div class="flex items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-indigo-600">
                        <input type="date" id="date" name="date" required value={formData.date} onChange={handleChange} />
                    </div>
                </div>

                <div class="mt-2">
                    <label for="weight" class="block text-sm/6 font-medium text-gray-900">Weight</label>

                    <div class="flex items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-indigo-600">
                        <input type="text" id="weight" name="weight" value={formData.weight} onChange={handleChange} />
                    </div>
                </div>
                <div class="mt-2">
                    <label for="height" class="block text-sm/6 font-medium text-gray-900">Height (cm)</label>
                    <div class="flex items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-indigo-600">
                        <input type="text" id="height" name="height" value={formData.height} onChange={handleChange} />
                    </div>
                </div>
                <div class="mt-2">
                    <label for="notes" class="block text-sm/6 font-medium text-gray-900">Notes</label>
                    <div class="flex items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-indigo-600">
                        <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange}></textarea>
                    </div>
                </div>
                <div class="flex mt-2 justify-end">
                    <button type="submit" className="mb-4 px-2 py-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-colors">Add Entry</button>
                </div>
            </form>
        </div>
    );

}