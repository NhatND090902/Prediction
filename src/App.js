import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [inputValue, setInputValue] = useState("");
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");
  const [editingCell, setEditingCell] = useState(null);
  const [inputMode, setInputMode] = useState("click"); // "click" or "text"

  const handleInputChange = (value) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, "");

    // Limit to 3 digits
    if (numericValue.length <= 3) {
      setInputValue(numericValue);
      setError("");
    }
  };

  const handleNumberClick = (number) => {
    if (selectedNumbers.length < 3) {
      setSelectedNumbers([...selectedNumbers, number]);
      setError("");
    }
  };

  const handleClearNumbers = () => {
    setSelectedNumbers([]);
    setError("");
  };

  const handleRemoveLastNumber = () => {
    setSelectedNumbers(selectedNumbers.slice(0, -1));
    setError("");
  };

  const handleModeSwitch = (mode) => {
    setInputMode(mode);
    // Clear both inputs when switching modes
    setSelectedNumbers([]);
    setInputValue("");
    setError("");
  };

  const handleClearHistory = () => {
    if (
      window.confirm(
        "Are you sure you want to clear history and keep only the last 20 records?"
      )
    ) {
      setRecords((prevRecords) => prevRecords.slice(0, 20));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let digits = [];

    // Check based on current input mode
    if (inputMode === "click") {
      if (selectedNumbers.length !== 3) {
        setError("Please select exactly 3 numbers");
        return;
      }
      digits = selectedNumbers;
    } else {
      if (inputValue.length !== 3) {
        setError("Please enter exactly 3 digits");
        return;
      }
      // Split the 3-digit number into individual digits
      digits = inputValue.split("").map((digit) => parseInt(digit));

      // Validate each digit is between 1-6
      const hasInvalidDigits = digits.some((digit) => digit < 1 || digit > 6);
      if (hasInvalidDigits) {
        setError("Each digit must be between 1 and 6");
        return;
      }
    }

    // Create new record
    const newRecord = {
      id: Date.now(),
      numbers: digits,
      timestamp: new Date(),
    };

    setRecords((prevRecords) => [newRecord, ...prevRecords]);
    setInputValue("");
    setSelectedNumbers([]);
    setError("");
  };

  const handleCellEdit = (recordId, numberIndex, newValue) => {
    const numValue = parseInt(newValue);
    if (isNaN(numValue) || numValue < 1 || numValue > 6) {
      alert("Number must be between 1 and 6");
      return;
    }

    setRecords((prevRecords) =>
      prevRecords.map((record) =>
        record.id === recordId
          ? {
              ...record,
              numbers: record.numbers.map((num, index) =>
                index === numberIndex ? numValue : num
              ),
            }
          : record
      )
    );
    setEditingCell(null);
  };

  const getTaiXiu = (sum) => {
    return sum >= 3 && sum <= 10 ? "Xiu" : "Tai";
  };

  const getEvenOdd = (sum) => {
    return sum % 2 === 0 ? "Even" : "Odd";
  };

  const getConsecutiveCount = (records, index, type) => {
    if (records.length === 0) return 0;

    const currentRecord = records[index];
    const currentSum = currentRecord.numbers.reduce((sum, num) => sum + num, 0);
    const currentValue =
      type === "taixiu" ? getTaiXiu(currentSum) : getEvenOdd(currentSum);

    let count = 1;
    for (let i = index + 1; i < records.length; i++) {
      const sum = records[i].numbers.reduce((sum, num) => sum + num, 0);
      const value = type === "taixiu" ? getTaiXiu(sum) : getEvenOdd(sum);
      if (value === currentValue) {
        count++;
      } else {
        break;
      }
    }

    return count;
  };

  const getCurrentConsecutiveTaiXiu = () => {
    if (records.length === 0) return { type: "None", count: 0 };

    const firstRecord = records[0];
    const firstSum = firstRecord.numbers.reduce((sum, num) => sum + num, 0);
    const currentType = getTaiXiu(firstSum);

    let count = 1;
    for (let i = 1; i < records.length; i++) {
      const sum = records[i].numbers.reduce((sum, num) => sum + num, 0);
      const type = getTaiXiu(sum);
      if (type === currentType) {
        count++;
      } else {
        break;
      }
    }

    return { type: currentType, count };
  };

  const getCurrentConsecutiveEvenOdd = () => {
    if (records.length === 0) return { type: "None", count: 0 };

    const firstRecord = records[0];
    const firstSum = firstRecord.numbers.reduce((sum, num) => sum + num, 0);
    const currentType = getEvenOdd(firstSum);

    let count = 1;
    for (let i = 1; i < records.length; i++) {
      const sum = records[i].numbers.reduce((sum, num) => sum + num, 0);
      const type = getEvenOdd(sum);
      if (type === currentType) {
        count++;
      } else {
        break;
      }
    }

    return { type: currentType, count };
  };

  const getConsecutiveRecordsSinceLastAppearance = (number) => {
    if (records.length === 0) return 0;

    // Find the most recent record containing this number
    let lastAppearanceIndex = -1;
    for (let i = 0; i < records.length; i++) {
      if (records[i].numbers.includes(number)) {
        lastAppearanceIndex = i;
        break;
      }
    }

    // If number never appeared, return total number of records
    if (lastAppearanceIndex === -1) {
      return records.length;
    }

    // Return the number of records since last appearance
    return lastAppearanceIndex;
  };

  const getNextNumberPrediction = () => {
    if (records.length < 2) {
      return {
        latestRecord: records[0] || null,
        nextPredictions: [[], [], []],
      };
    }

    const latestRecord = records[0];
    // Limit to latest 20 records (excluding the current latest record)
    const historyRecords = records.slice(1, 26); // Get records 1-24 (excluding index 0)

    // Analyze each column for next number prediction
    const nextPredictions = [[], [], []];

    for (let col = 0; col < 3; col++) {
      const currentNumber = latestRecord.numbers[col];
      const nextNumbers = [];

      // Find all occurrences of currentNumber in this column in history (limited to 20 records)
      for (let i = 0; i < historyRecords.length; i++) {
        if (historyRecords[i].numbers[col] === currentNumber) {
          // Look for the next record down (closer to present) - that's i-1 since records are in reverse chronological order
          if (i - 1 >= 0) {
            const nextNumber = historyRecords[i - 1].numbers[col];
            nextNumbers.push(nextNumber);
          }
        }
      }

      // Count frequency of next numbers
      const numberCounts = {};
      nextNumbers.forEach((num) => {
        numberCounts[num] = (numberCounts[num] || 0) + 1;
      });

      // Convert to array and sort by frequency (descending)
      nextPredictions[col] = Object.entries(numberCounts)
        .map(([number, count]) => ({ number: parseInt(number), count }))
        .sort((a, b) => b.count - a.count);
    }

    return { latestRecord, nextPredictions };
  };

  const getPredictionAnalysis = () => {
    if (records.length < 2) {
      return {
        latestRecord: records[0] || null,
        columnPredictions: [[], [], []],
      };
    }

    const latestRecord = records[0];
    const historyRecords = records.slice(1); // Exclude the latest record

    // Analyze each column for vertical prediction
    const columnPredictions = [[], [], []];

    for (let col = 0; col < 3; col++) {
      const currentNumber = latestRecord.numbers[col];
      const nextNumbers = [];

      // Find all occurrences of currentNumber in this column in history
      for (let i = 0; i < historyRecords.length; i++) {
        if (historyRecords[i].numbers[col] === currentNumber) {
          // Look for the next record down (i+1)
          if (i + 1 < historyRecords.length) {
            const nextNumber = historyRecords[i + 1].numbers[col];
            nextNumbers.push(nextNumber);
          }
        }
      }

      // Count frequency of next numbers
      const numberCounts = {};
      nextNumbers.forEach((num) => {
        numberCounts[num] = (numberCounts[num] || 0) + 1;
      });

      // Convert to array and sort by frequency (descending)
      columnPredictions[col] = Object.entries(numberCounts)
        .map(([number, count]) => ({ number: parseInt(number), count }))
        .sort((a, b) => b.count - a.count);
    }

    return { latestRecord, columnPredictions };
  };

  const getHistoryAnalysis = (currentNumbers) => {
    if (records.length === 0) return [[], [], []];

    // Get last 20 records (excluding current input)
    const last20Records = records.slice(0, 20);

    // Count frequency for each column
    const columnAnalysis = [[], [], []];

    for (let col = 0; col < 3; col++) {
      const numberCounts = {};

      last20Records.forEach((record) => {
        const number = record.numbers[col];
        numberCounts[number] = (numberCounts[number] || 0) + 1;
      });

      // Convert to array and sort by frequency (descending)
      columnAnalysis[col] = Object.entries(numberCounts)
        .map(([number, count]) => ({ number: parseInt(number), count }))
        .sort((a, b) => b.count - a.count);
    }

    return columnAnalysis;
  };

  return (
    <div className="App">
      <div className="container">
        <h1>Tai Xiu Game Tracker</h1>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="input-form">
          {/* Mode Toggle Button */}
          <div className="mode-toggle-section">
            <div className="mode-buttons">
              <button
                type="button"
                className={`mode-button ${
                  inputMode === "text" ? "active" : ""
                }`}
                onClick={() =>
                  handleModeSwitch(inputMode === "click" ? "text" : "click")
                }
                title={
                  inputMode === "click"
                    ? "Switch to Type Mode"
                    : "Switch to Click Mode"
                }
              ></button>
            </div>
          </div>

          {/* Click Numbers Mode */}
          {inputMode === "click" && (
            <div className="number-selector-section">
              <div className="selected-numbers-display">
                <div className="selected-numbers">
                  {selectedNumbers.length > 0 ? (
                    selectedNumbers.map((num, index) => (
                      <span key={index} className="selected-number">
                        {num}
                      </span>
                    ))
                  ) : (
                    <span className="placeholder">
                      Click numbers below to select...
                    </span>
                  )}
                </div>
              </div>

              <div className="number-buttons">
                {[1, 2, 3, 4, 5, 6].map((number) => (
                  <button
                    key={number}
                    type="button"
                    className="number-button"
                    onClick={() => handleNumberClick(number)}
                    disabled={selectedNumbers.length >= 3}
                  >
                    {number}
                  </button>
                ))}
                <div className="control-buttons">
                  <button
                    type="button"
                    className="control-button clear-button"
                    onClick={handleClearNumbers}
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    className="control-button remove-button"
                    onClick={handleRemoveLastNumber}
                    disabled={selectedNumbers.length === 0}
                  >
                    Remove Last
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Text Input Mode */}
          {inputMode === "text" && (
            <div className="text-input-section">
              <div className="input-row">
                <div className="input-group">
                  <input
                    type="text"
                    maxLength="3"
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="123"
                    className={error ? "error" : ""}
                    autoFocus
                  />
                </div>
              </div>
            </div>
          )}

          {error && <div className="error-message-main">{error}</div>}
          <button type="submit" className="submit-button">
            Add Record
          </button>
        </form>

        {/* Combined Analysis Section */}
        {records.length > 0 && (
          <div className="combined-analysis-section">
            <div className="analysis-row">
              {/* Total Analysis */}
              <div className="total-section">
                <h2>Total Analysis</h2>
                <table className="total-table">
                  <thead>
                    <tr>
                      <th>1</th>
                      <th>2</th>
                      <th>3</th>
                      <th>4</th>
                      <th>5</th>
                      <th>6</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{getConsecutiveRecordsSinceLastAppearance(1)}</td>
                      <td>{getConsecutiveRecordsSinceLastAppearance(2)}</td>
                      <td>{getConsecutiveRecordsSinceLastAppearance(3)}</td>
                      <td>{getConsecutiveRecordsSinceLastAppearance(4)}</td>
                      <td>{getConsecutiveRecordsSinceLastAppearance(5)}</td>
                      <td>{getConsecutiveRecordsSinceLastAppearance(6)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Additional Consecutive Analysis Table */}
                <table className="consecutive-table">
                  <thead>
                    <tr>
                      <th>Tai/Xiu</th>
                      <th>Even/Odd</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        {(() => {
                          const { type, count } = getCurrentConsecutiveTaiXiu();
                          return `${type} (${count} times)`;
                        })()}
                      </td>
                      <td>
                        {(() => {
                          const { type, count } =
                            getCurrentConsecutiveEvenOdd();
                          return `${type} (${count} times)`;
                        })()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Next Number Prediction */}
              <div className="next-prediction-section">
                <h2>Next Number Prediction</h2>
                <table className="next-prediction-table">
                  <thead>
                    <tr className="current-numbers-header">
                      {(() => {
                        const { latestRecord } = getNextNumberPrediction();
                        return latestRecord
                          ? latestRecord.numbers.map((number, index) => (
                              <th key={index}>{number}</th>
                            ))
                          : [
                              <th key="1">-</th>,
                              <th key="2">-</th>,
                              <th key="3">-</th>,
                            ];
                      })()}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const { nextPredictions } = getNextNumberPrediction();

                      // Find the maximum number of predictions across all columns
                      const maxPredictions = Math.max(
                        ...nextPredictions.map((col) => col.length),
                        1 // At least 1 row even if no predictions
                      );

                      // Create rows for predictions
                      const rows = [];
                      for (
                        let rowIndex = 0;
                        rowIndex < maxPredictions;
                        rowIndex++
                      ) {
                        rows.push(
                          <tr key={rowIndex} className="prediction-row">
                            {nextPredictions.map((columnData, colIndex) => (
                              <td key={colIndex} className="prediction-cell">
                                {columnData[rowIndex] ? (
                                  <div className="prediction-item-stacked">
                                    {columnData[rowIndex].number} (
                                    {columnData[rowIndex].count})
                                  </div>
                                ) : (
                                  <div className="prediction-item-stacked empty">
                                    {rowIndex === 0 && columnData.length === 0
                                      ? "N/A"
                                      : ""}
                                  </div>
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      }

                      return rows;
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Records Table */}
        {records.length > 0 && (
          <div className="records-section">
            <div className="records-header">
              <h2>History Records ({records.length})</h2>
              <button
                type="button"
                className="clear-history-button"
                onClick={handleClearHistory}
                title="Keep only last 20 records"
              >
                Clear History
              </button>
            </div>
            <table className="records-table">
              <thead>
                <tr>
                  <th>Num1</th>
                  <th>Num2</th>
                  <th>Num3</th>
                  <th>Tai/Xiu</th>
                  <th>Even/Odd</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, recordIndex) => {
                  const sum = record.numbers.reduce((sum, num) => sum + num, 0);
                  const taixiuCount = getConsecutiveCount(
                    records,
                    recordIndex,
                    "taixiu"
                  );
                  const evenoddCount = getConsecutiveCount(
                    records,
                    recordIndex,
                    "evenodd"
                  );

                  return (
                    <tr key={record.id}>
                      {record.numbers.map((number, numIndex) => (
                        <td
                          key={numIndex}
                          className="editable-cell"
                          onClick={() =>
                            setEditingCell(`${record.id}-${numIndex}`)
                          }
                        >
                          {editingCell === `${record.id}-${numIndex}` ? (
                            <input
                              type="number"
                              min="1"
                              max="6"
                              defaultValue={number}
                              autoFocus
                              onBlur={(e) =>
                                handleCellEdit(
                                  record.id,
                                  numIndex,
                                  e.target.value
                                )
                              }
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  handleCellEdit(
                                    record.id,
                                    numIndex,
                                    e.target.value
                                  );
                                }
                              }}
                            />
                          ) : (
                            number
                          )}
                        </td>
                      ))}
                      <td>
                        {getTaiXiu(sum)} ({taixiuCount} times)
                      </td>
                      <td>
                        {getEvenOdd(sum)} ({evenoddCount} times)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
