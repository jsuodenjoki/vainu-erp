"use client";

import { useState } from "react";
import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline";

/**
 * Multi-select checkbox picker.
 * Props:
 *   label        - string label above the picker
 *   items        - array of { _id, label } objects to pick from
 *   selected     - array of selected _ids
 *   onChange(ids) - callback with new array of selected _ids
 *   placeholder  - text when nothing selected
 */
export default function MultiPicker({ label, items = [], selected = [], onChange, placeholder = "Valitse..." }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const toggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const selectedItems = items.filter(i => selected.includes(i._id));
  const filtered = search.trim()
    ? items.filter(i => i.label.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => { setOpen(o => !o); setSearch(""); }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <span className={selectedItems.length === 0 ? "text-gray-400" : "text-gray-800"}>
            {selectedItems.length === 0
              ? placeholder
              : selectedItems.map(i => i.label).join(", ")}
          </span>
          <ChevronDownIcon className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="px-2 pt-2 pb-1 border-b border-gray-100">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Hae..."
                className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                onClick={e => e.stopPropagation()}
              />
            </div>
            <div className="max-h-28 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-400">–</div>
              ) : (
                filtered.map(item => (
                  <label key={item._id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.includes(item._id)}
                      onChange={() => toggle(item._id)}
                      className="h-3.5 w-3.5 accent-indigo-600"
                    />
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected chips */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selectedItems.map(item => (
            <span key={item._id} className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
              {item.label}
              <button type="button" onClick={() => toggle(item._id)}>
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
