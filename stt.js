// stt.js - Sequential Speech to Text Input

// --- State and Configuration ---
// Check for browser vendor prefixes
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition; // Will hold the recognition instance
let isListening = false; // Flag to track if recognition is active
let currentSttField = 'none'; // Tracks which field is currently being listened for ('description', 'datetime', 'frequency', or 'none')
let sttData = { // Store intermediate results from voice input
    description: null,
    dateTimeString: null, // Raw string for date/time
    parsedIsoDateTime: null, // Parsed date/time from backend
    frequency: null
};
let sttFieldElements = {}; // Store references to buttons, status elements, and associated input fields

// --- Initialization ---
/**
 * Initializes the Speech Recognition engine and UI elements.
 * Should be called from the main script's initApp after elements are ready.
 */
function initSTT() {
    console.log("STT: Initializing...");
    if (SpeechRecognitionAPI) {
        recognition = new SpeechRecognitionAPI();
        recognition.continuous = false; // Process single utterances
        recognition.lang = 'en-US';     // Set language (adjust if needed)
        recognition.interimResults = true; // Get results as the user speaks for better feedback
        recognition.maxAlternatives = 1; // Get the single most likely transcript

        setupRecognitionEventHandlers(); // Attach event listeners to the recognition object

        // Store references to related UI elements
        // Assumes 'elements' object from script.js is populated and accessible
        // and that the necessary IDs exist in index.html
        sttFieldElements = {
            description: {
                btn: elements.sttBtnDescription,
                status: elements.sttStatusDescription,
                input: elements.taskInput // Input field to flash/update
            },
            datetime: {
                btn: elements.sttBtnDateTime,
                status: elements.sttStatusDateTime,
                input: elements.dueDate // Flash the date input for date/time field
            },
            frequency: {
                btn: elements.sttBtnFrequency,
                status: elements.sttStatusFrequency,
                input: elements.repeatFrequency // Select element to flash/update
            }
        };
        console.log("STT: Ready.");
        updateAllStatuses("Tap mic to speak"); // Set initial status message

    } else {
        console.warn("STT: Speech Recognition API not supported in this browser.");
        // Disable all STT buttons if the API is not supported
        ['sttBtnDescription', 'sttBtnDateTime', 'sttBtnFrequency'].forEach(id => {
            if (elements[id]) {
                elements[id].disabled = true;
                elements[id].style.opacity = 0.5;
                elements[id].title = "Voice input not supported";
            }
        });
        updateAllStatuses("Voice input not supported");
    }
}

// --- Event Handlers for SpeechRecognition ---
/**
 * Sets up the event handlers (onstart, onresult, onerror, onend)
 * for the SpeechRecognition object.
 */
function setupRecognitionEventHandlers() {
    if (!recognition) return;

    // Fired when recognition starts listening
    recognition.onstart = () => {
        isListening = true;
        console.log(`STT: Listening started for field: ${currentSttField}...`);
        updateFieldStatus(currentSttField, "Listening...", false);
        flashFeedback(currentSttField); // Start visual flash indication
        sttFieldElements[currentSttField]?.btn?.classList.add('listening'); // Style the mic button
    };

    // Fired when speech results are received
    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        // Loop through results (though usually only one with continuous=false)
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript; // Show interim results
            }
        }

        // Update the status element for the current field with interim results
        updateFieldStatus(currentSttField, interimTranscript || "Listening...", false);

        // If we have a final transcript, process it
        if (finalTranscript) {
            console.log(`STT: Final Transcript for ${currentSttField}:`, finalTranscript);
            // Call the processing function (which might be async)
            processTranscriptForField(finalTranscript.trim());
            // Note: Recognition stops automatically after final result if continuous is false
        }
    };

    // Fired when a recognition error occurs
    recognition.onerror = (event) => {
        console.error(`STT Error for ${currentSttField}:`, event.error);
        let errorMessage = `Error: ${event.error}`;
        // Provide more user-friendly error messages
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            errorMessage = "Microphone access denied.";
            // Optionally prompt user how to enable it
        } else if (event.error === 'no-speech') {
            errorMessage = "No speech detected. Try again.";
        } else if (event.error === 'network') {
            errorMessage = "Network error during recognition.";
        } else if (event.error === 'audio-capture') {
            errorMessage = "Microphone problem detected.";
        } else if (event.error === 'aborted') {
            errorMessage = "Listening stopped."; // Less like an error
        }

        updateFieldStatus(currentSttField, errorMessage, event.error !== 'aborted'); // Mark as error unless aborted
        // Let onend handle UI cleanup like removing 'listening' class and flash
    };

    // Fired when recognition ends (either successfully, on error, or stopped)
    recognition.onend = () => {
        // Check isListening because onend can fire even if we called stop() prematurely
        if (!isListening) {
            console.log("STT: onend fired but not actively listening (likely stopped manually).");
            return;
        }

        isListening = false; // Update state
        console.log(`STT: Listening ended for ${currentSttField}.`);

        const statusElement = sttFieldElements[currentSttField]?.status;
        const currentStatus = statusElement?.textContent || '';

        // Reset status message only if it wasn't left in an error or processing state
        if (!currentStatus.toLowerCase().includes('error') && !currentStatus.toLowerCase().includes('processing') && !currentStatus.toLowerCase().includes('set:')) {
             updateFieldStatus(currentSttField, "Tap mic to speak.", false);
        }

        clearFlashFeedback(currentSttField); // Ensure flashing stops
        sttFieldElements[currentSttField]?.btn?.classList.remove('listening'); // Reset mic button style

        // Reset current field context if processing didn't set up the next step
        // This handles cases where recognition ends unexpectedly (e.g., timeout)
        // Note: processTranscriptForField now resets currentSttField to 'none' on completion/error.
        // if (currentSttField !== 'none') {
        //      console.log("STT: Resetting current field due to unexpected end.");
        //      currentSttField = 'none';
        // }
    };
}

// --- Control Functions ---
/**
 * Starts the speech recognition process for a specific field.
 * @param {string} fieldName - 'description', 'datetime', or 'frequency'.
 */
function startListening(fieldName) {
    if (!recognition) {
        // Use showCustomAlert from main script if available
        if (typeof showCustomAlert === 'function') {
            showCustomAlert("Error", "Voice input not available in this browser.", "error");
        } else {
            alert("Voice input not available in this browser.");
        }
        return;
    }
    if (isListening) {
        // Inform user they need to finish the current input first
        if (typeof showCustomAlert === 'function') {
             showCustomAlert("Voice Input Busy", `Already listening for the ${currentSttField}. Please finish or wait.`, "info");
        } else {
             alert(`Already listening for the ${currentSttField}. Please finish or wait.`);
        }
        console.warn(`STT: startListening called for ${fieldName} while already listening for ${currentSttField}.`);
        return;
    }

    // Reset intermediate data for the target field
    sttData[fieldName] = null;
    if (fieldName === 'datetime') {
        sttData.dateTimeString = null;
        sttData.parsedIsoDateTime = null;
    }

    currentSttField = fieldName; // Set the context for event handlers
    console.log(`STT: Attempting to start listening for ${currentSttField}`);
    updateAllStatuses(" "); // Clear status messages on other fields
    updateFieldStatus(currentSttField, "Waiting for mic...", false); // Initial status

    try {
        // Start the recognition - this might trigger the browser's permission prompt
        recognition.start();
    } catch (e) {
        // Catch immediate errors (e.g., if already started, though isListening should prevent this)
        console.error(`STT: Error calling recognition.start() for ${currentSttField}:`, e);
        updateFieldStatus(currentSttField, "Error starting mic.", true);
        currentSttField = 'none'; // Reset state
        isListening = false; // Ensure state consistency
    }
}

/**
 * Manually stops the speech recognition if it's currently active.
 */
function stopListening() {
    if (recognition && isListening) {
        console.log("STT: Stopping listening manually.");
        isListening = false; // Set flag immediately to prevent race conditions in onend
        recognition.stop();
        // UI cleanup (flash, button style, status) will be handled by the onend event
    }
    // Explicitly clear UI feedback here as well in case onend doesn't fire quickly
    clearFlashFeedback(currentSttField);
    sttFieldElements[currentSttField]?.btn?.classList.remove('listening');
    updateFieldStatus(currentSttField, "Tap mic to speak.", false);
    currentSttField = 'none'; // Reset field context
}

// --- UI Feedback Functions ---
/**
 * Updates the status message for all STT fields.
 * @param {string} message - The message to display.
 * @param {boolean} isError - If true, style as an error.
 */
function updateAllStatuses(message, isError = false) {
     for (const field in sttFieldElements) {
         updateFieldStatus(field, message, isError);
     }
}

/**
 * Updates the status message for a specific STT field.
 * @param {string} fieldName - 'description', 'datetime', or 'frequency'.
 * @param {string} message - The message to display.
 * @param {boolean} isError - If true, style as an error.
 */
function updateFieldStatus(fieldName, message, isError = false) {
    // Check if fieldName is valid and exists in our mapping
    if (!fieldName || !sttFieldElements[fieldName]) {
        // console.warn(`updateFieldStatus called with invalid fieldName: ${fieldName}`);
        return;
    }
    const element = sttFieldElements[fieldName]?.status;
    if (element) {
        element.textContent = message;
        // Apply error styling if needed (uses CSS variables from main styles.css)
        element.style.color = isError ? 'var(--priority-high)' : 'var(--text-muted-color)';
        element.style.fontWeight = isError ? 'bold' : 'normal';

        // Set a timeout to clear temporary messages (errors, success confirmations)
        if (isError || message.toLowerCase().includes("recognized") || message.toLowerCase().includes("set to") || message.toLowerCase().includes("set:")) {
             setTimeout(() => {
                // Only clear the message if it hasn't been updated again in the meantime
                if (element.textContent === message) {
                     updateFieldStatus(fieldName, "Tap mic to speak.", false); // Reset to default prompt
                 }
             }, isError ? 5000 : 3000); // Show errors longer (5s) than success messages (3s)
         }
    }
}

/**
 * Initiates the flashing visual feedback on the target input element.
 * @param {string} fieldName - 'description', 'datetime', or 'frequency'.
 */
function flashFeedback(fieldName) {
     const elementInfo = sttFieldElements[fieldName];
     const targetElement = elementInfo?.input; // The input/select element to flash
     if (!targetElement) return;

     clearFlashFeedback(fieldName); // Ensure no previous interval is running for this field

     let flashCount = 0;
     let expectedFlashes;
     // Determine number of flashes based on the field
     switch(fieldName) {
         case 'description': expectedFlashes = 1; break;
         case 'datetime': expectedFlashes = 2; break;
         case 'frequency': expectedFlashes = 3; break;
         default: expectedFlashes = 1;
     }

     // Start the first flash immediately
     targetElement.classList.add('stt-flash-active');
     console.log(`STT Flash: Flash ${flashCount + 1} ON for ${fieldName}`);

     // Use setInterval to toggle the class for the flashing effect
     const intervalId = setInterval(() => {
         const isOn = targetElement.classList.toggle('stt-flash-active');
         if (!isOn) { // Class was just removed (flash turned OFF)
             flashCount++;
             console.log(`STT Flash: Flash ${flashCount} OFF for ${fieldName}`);
             if (flashCount >= expectedFlashes) {
                 // Stop flashing after the expected number of cycles
                 clearInterval(intervalId);
                 targetElement.dataset.flashInterval = ''; // Clear the interval ID reference
                 console.log(`STT Flash: Flashing complete for ${fieldName}`);
             } else {
                  // Turn back ON shortly for the next flash cycle
                  // This ensures the "on" part of the next flash starts quickly
                  setTimeout(() => {
                      // Check if interval hasn't been cleared by something else (e.g., stopListening)
                      if (targetElement.dataset.flashInterval === intervalId.toString()) {
                           targetElement.classList.add('stt-flash-active');
                           console.log(`STT Flash: Flash ${flashCount + 1} ON for ${fieldName}`);
                      }
                  }, 100); // Brief delay before turning back on (adjust timing)
             }
         }
         // else: Class was just added (flash turned ON) - no action needed here
     }, 400); // Interval duration (controls speed of on/off cycle - adjust as needed)

     // Store the interval ID on the element so we can clear it later
     targetElement.dataset.flashInterval = intervalId.toString();
}

/**
 * Stops the flashing feedback for a specific field or all fields.
 * @param {string} fieldName - 'description', 'datetime', 'frequency', or 'none' to clear all.
 */
function clearFlashFeedback(fieldName) {
    if (fieldName === 'none') {
        // Clear flash from all potential elements
        for (const key in sttFieldElements) {
            const el = sttFieldElements[key]?.input;
            if (el && el.dataset.flashInterval) {
                 clearInterval(parseInt(el.dataset.flashInterval));
                 el.classList.remove('stt-flash-active');
                 el.dataset.flashInterval = '';
                 console.log(`STT Flash: Cleared flash for ${key}`);
            }
        }
    } else {
        // Clear flash from a specific element
        const elementInfo = sttFieldElements[fieldName];
        const targetElement = elementInfo?.input;
        if (targetElement && targetElement.dataset.flashInterval) {
            clearInterval(parseInt(targetElement.dataset.flashInterval));
            targetElement.classList.remove('stt-flash-active');
            targetElement.dataset.flashInterval = '';
            console.log(`STT Flash: Cleared flash for ${fieldName}`);
        }
    }
}

// --- Transcript Processing ---
/**
 * Processes the final transcript based on the current field context.
 * Updates UI elements and determines the next step in the sequence.
 * @param {string} transcript - The final text from speech recognition.
 */
async function processTranscriptForField(transcript) {
    updateFieldStatus(currentSttField, `Processing: "${transcript}"`, false);
    let nextFieldToPrompt = 'none'; // Which field to prompt for next
    let success = false; // Did processing succeed for the current field?

    try {
        switch (currentSttField) {
            case 'description':
                // Validate description length
                if (transcript.length > 0 && transcript.length <= 150) {
                     sttData.description = transcript; // Store data
                     if (elements.taskInput) elements.taskInput.value = transcript; // Update UI
                     updateFieldStatus('description', `Set: "${transcript.substring(0, 30)}..."`, false); // Show confirmation
                     nextFieldToPrompt = 'datetime'; // Set up for next step
                     success = true;
                 } else if (transcript.length > 150) {
                     updateFieldStatus('description', `Too long (${transcript.length}/150 chars). Try again.`, true);
                 } else {
                     updateFieldStatus('description', `Description seems empty. Try again.`, true);
                 }
                break;

            case 'datetime':
                sttData.dateTimeString = transcript; // Store the raw spoken string

                // Call Backend API to parse the natural language date/time
                updateFieldStatus('datetime', `Asking server to parse: "${transcript}"...`, false);
                try {
                    // Use apiRequest from script.js (ensure it's globally accessible or passed)
                    const response = await apiRequest('/api/parse-datetime', 'POST', { text: transcript });

                    if (response && !response.error) {
                        // Backend successfully parsed
                        console.log("STT Parse Response:", response);
                        // Choose the correct date/time format based on user settings (from main script's state)
                        const dateStr = (state.settings.dateFormat === 'DDMMYYYY') ? response.date_str_dmy : response.date_str_mdy;
                        const timeStr = (state.settings.timeFormat === '12hr') ? response.time_str_12 : response.time_str_24;

                        // Update UI fields
                        if (dateStr) elements.dueDate.value = dateStr;
                        if (timeStr) elements.dueTime.value = timeStr;

                        sttData.parsedIsoDateTime = response.iso; // Store parsed ISO date if needed

                        updateFieldStatus('datetime', `Set: "${transcript}"`, false);
                        nextFieldToPrompt = 'frequency'; // Set up for next step
                        success = true;

                    } else {
                        // Backend returned an error (parsing failed)
                        const errorMsg = response?.error || `Could not parse: "${transcript}"`;
                        updateFieldStatus('datetime', errorMsg, true);
                        success = false;
                    }
                } catch (error) {
                    // Network error calling the backend API
                    console.error("Error calling /api/parse-datetime:", error);
                    updateFieldStatus('datetime', `Network error parsing date/time. Try again.`, true);
                    success = false;
                }
                break;

            case 'frequency':
                // Use the local JavaScript parser for frequency (simpler)
                const matchedFreq = parseFrequencyNaturalLanguage(transcript);
                if (matchedFreq !== null) { // 'none' is a valid match
                    sttData.frequency = matchedFreq;
                    if (elements.repeatFrequency) elements.repeatFrequency.value = matchedFreq; // Update UI dropdown
                    // Trigger change handler from main script to update dependent UI (like repeatUntil)
                    if (typeof handleRepeatFrequencyChange === 'function') {
                         handleRepeatFrequencyChange();
                    }
                    updateFieldStatus('frequency', `Set to: ${matchedFreq}`, false);
                    nextFieldToPrompt = 'done'; // End of sequence
                    success = true;
                } else {
                    // Frequency not recognized
                    updateFieldStatus('frequency', `Unrecognized frequency: "${transcript}". Try 'Daily', 'Weekly', 'No Repeat', etc.`, true);
                    success = false;
                }
                break;

            default:
                console.warn("STT: Transcript processed with no target field context.");
                if (typeof showCustomAlert === 'function') {
                    showCustomAlert("Error", "Voice input wasn't targeting a specific field.", "error");
                }
                success = false;
                break;
        }
    } catch(err) {
         // Catch unexpected errors during processing
         console.error(`Error processing transcript for ${currentSttField}:`, err);
         updateFieldStatus(currentSttField, "Error processing input.", true);
         success = false;
    }

    // --- Handle Transition to Next Step ---
    const previousField = currentSttField; // Remember which field just finished
    currentSttField = 'none'; // Reset the current field context

    if (success) {
        // If processing was successful, prompt for the next field
        if (nextFieldToPrompt === 'datetime') {
            // Don't automatically start listening, just prompt
            flashFeedback('datetime'); // Flash the next field
            updateFieldStatus('datetime', 'Ready for Date/Time', false); // Update status
        } else if (nextFieldToPrompt === 'frequency') {
            flashFeedback('frequency');
            updateFieldStatus('frequency', 'Ready for Frequency', false);
        } else if (nextFieldToPrompt === 'done') {
            // Sequence finished successfully
            updateAllStatuses("Ready to Add Task");
            // Optionally flash and focus the main "Add Task" button
            elements.addTaskBtn?.classList.add('stt-flash-active');
            setTimeout(() => elements.addTaskBtn?.classList.remove('stt-flash-active'), 1000); // Brief flash
            elements.addTaskBtn?.focus();
        }
    } else {
        // If processing failed, indicate the user should retry the *same* field
        flashFeedback(previousField); // Re-flash the field that failed
        // Keep the error message displayed for a bit longer (handled by updateFieldStatus timeout)
        // updateFieldStatus(previousField, `Try again for ${previousField}.`, true); // Redundant if error already shown
    }
}


// --- Placeholder Parsing Functions ---

/**
 * Tries to match common frequency phrases from natural language.
 * @param {string} text - The transcribed text.
 * @returns {string|null} - The matched frequency value (e.g., 'daily', 'none') or null.
 */
function parseFrequencyNaturalLanguage(text) {
    const lowerText = text.toLowerCase().trim();
    let matchedValue = null;

    // Define keywords and their corresponding select values
    const options = [
        { value: 'none', terms: ['no repeat', 'none', 'never', 'don\'t repeat', 'one time', 'just once'] },
        { value: 'daily', terms: ['daily', 'every day', 'each day'] },
        { value: 'weekly', terms: ['weekly', 'every week', 'each week'] },
        { value: 'weekdays', terms: ['weekdays', 'every weekday', 'monday to friday'] },
        { value: 'weekends', terms: ['weekends', 'every weekend', 'saturday and sunday'] },
        { value: 'monthly', terms: ['monthly', 'every month', 'each month'] },
        { value: 'yearly', terms: ['yearly', 'annually', 'every year', 'each year'] }
        // Note: 'custom' is usually too complex for simple voice matching
    ];

    // Iterate through options and terms to find a match
    for (const option of options) {
        for (const term of option.terms) {
            // Use includes for partial matching, or exact match if needed: lowerText === term
            if (lowerText.includes(term)) {
                matchedValue = option.value;
                break; // Stop checking terms for this option once matched
            }
        }
        if (matchedValue !== null) {
            break; // Stop checking other options once a match is found
        }
    }

    console.log(`STT Parse Frequency: "${text}" -> Matched: ${matchedValue}`);
    return matchedValue; // Return the select value (e.g., 'daily') or null
}

// Note: The parseDateTimeNaturalLanguage function is removed as parsing is now done on the backend.