import React, { useState, useRef } from "react";
import "./App.css";

const API = "http://127.0.0.1:5000";

export default function App() {
  const [benchmarkFile, setBenchmarkFile] = useState(null);
  const [newDataFile, setNewDataFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState(null);
  const [stats, setStats] = useState({
    benchmark_rows: 0,
    new_rows: 0,
    duplicates_count: 0,
    unique_count: 0,
  });

  const benchInput = useRef(null);
  const newInput = useRef(null);

  const onDrop = (e, setter) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.name.toLowerCase().endsWith(".xlsx")) {
      setter(f);
      // Reset stats when new files are uploaded
      if (links) {
        setLinks(null);
        setStats({
          benchmark_rows: 0,
          new_rows: 0,
          duplicates_count: 0,
          unique_count: 0,
        });
      }
    }
  };

  const onDrag = (e) => e.preventDefault();

  const upload = async () => {
    if (!benchmarkFile || !newDataFile) {
      alert("Please select both files (.xlsx).");
      return;
    }

    const form = new FormData();
    form.append("benchmark", benchmarkFile);
    form.append("new_data", newDataFile);

    setLoading(true);
    setLinks(null);
    
    // Reset stats during processing
    setStats({
      benchmark_rows: 0,
      new_rows: 0,
      duplicates_count: 0,
      unique_count: 0,
    });

    try {
      const res = await fetch(`${API}/compare`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Server error");
      }

      // Update links and stats
      setLinks({
        duplicates: data.duplicates_url,
        unique: data.unique_url,
      });

      // Update stats with real data from backend
      setStats({
        benchmark_rows: data.stats?.benchmark_rows || 0,
        new_rows: data.stats?.new_rows || 0,
        duplicates_count: data.stats?.duplicates_count || 0,
        unique_count: data.stats?.unique_count || 0,
      });

    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file, setter) => {
    setter(file);
    // Reset results when new files are selected
    if (links) {
      setLinks(null);
      setStats({
        benchmark_rows: 0,
        new_rows: 0,
        duplicates_count: 0,
        unique_count: 0,
      });
    }
  };

  return (
    <>
      <div className="header">
        <h1>Excel Comparator</h1>
        <p>Upload Benchmark and New Data, then download Unique (highlighted) and Duplicates spreadsheets.</p>
      </div>

      <div className="container">
        {/* Header boxes */}
        <div className="stats">
          <div className="stat">
            <div className="label">Benchmark Rows</div>
            <div className="value">{stats.benchmark_rows.toLocaleString()}</div>
          </div>
          <div className="stat">
            <div className="label">New Data Rows</div>
            <div className="value">{stats.new_rows.toLocaleString()}</div>
          </div>
          <div className="stat">
            <div className="label">Duplicates</div>
            <div className="value" style={{ color: "var(--ok)" }}>
              {stats.duplicates_count.toLocaleString()}
            </div>
          </div>
          <div className="stat">
            <div className="label">Unique</div>
            <div className="value" style={{ color: "var(--warn)" }}>
              {stats.unique_count.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Upload cards */}
        <div className="grid">
          <div className="card">
            <h3>Benchmark Excel</h3>
            <p>Drag & drop your benchmark (.xlsx) or browse.</p>
            <div
              className="drop"
              onDragOver={onDrag}
              onDrop={(e) => onDrop(e, (file) => handleFileSelect(file, setBenchmarkFile))}
              onClick={() => benchInput.current.click()}
              role="button"
              tabIndex={0}
            >
              <div className="left">
                <span className="badge">.xlsx</span>
                <span className="filename">
                  {benchmarkFile ? benchmarkFile.name : "No file selected"}
                </span>
              </div>
              <div className="hint">Drop here or click to choose</div>
              <input
                ref={benchInput}
                type="file"
                accept=".xlsx"
                onChange={(e) => handleFileSelect(e.target.files[0], setBenchmarkFile)}
              />
            </div>
            <div className="help">This file is treated as the ground truth for change highlighting.</div>
          </div>

          <div className="card">
            <h3>New Data Excel</h3>
            <p>Drag & drop the new quarter's data (.xlsx) or browse.</p>
            <div
              className="drop"
              onDragOver={onDrag}
              onDrop={(e) => onDrop(e, (file) => handleFileSelect(file, setNewDataFile))}
              onClick={() => newInput.current.click()}
              role="button"
              tabIndex={0}
            >
              <div className="left">
                <span className="badge">.xlsx</span>
                <span className="filename">
                  {newDataFile ? newDataFile.name : "No file selected"}
                </span>
              </div>
              <div className="hint">Drop here or click to choose</div>
              <input
                ref={newInput}
                type="file"
                accept=".xlsx"
                onChange={(e) => handleFileSelect(e.target.files[0], setNewDataFile)}
              />
            </div>
            <div className="help">Differences vs benchmark are highlighted in yellow.</div>
          </div>
        </div>

        {/* Actions */}
        <div className="actions">
          <button className="button" onClick={upload} disabled={loading}>
            {loading ? "Processing…" : "Compare"}
          </button>

          {links && (
            <div className="links">
              <a
                className="button secondary"
                href={`${API}${links.duplicates}`}
                download
              >
                Download Duplicates ({stats.duplicates_count})
              </a>
              <a
                className="button secondary"
                href={`${API}${links.unique}`}
                download
              >
                Download Unique ({stats.unique_count})
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}