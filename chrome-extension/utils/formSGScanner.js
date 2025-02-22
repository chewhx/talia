///// WIthout Button Option
// function extractQuestions() {
//   const questions = [];
//   const formControls = document.querySelectorAll(".chakra-form-control");

//   formControls.forEach((control, index) => {
//     const labelElement = control.querySelector(".chakra-form__label");
//     if (!labelElement) return;

//     const questionText = labelElement
//       .querySelector(".css-9x4jlj")
//       .textContent.trim();
//     const questionNumber = index + 1;
//     let type, options, id, required;

//     const inputElement = control.querySelector(
//       "input, select, .chakra-input__group input"
//     );
//     if (inputElement) {
//       id = inputElement.id;
//       required = inputElement.required;
//     }

//     if (control.querySelector(".chakra-radio-group")) {
//       type = "radio";
//       options = Array.from(control.querySelectorAll(".chakra-radio")).map(
//         (radio) => ({
//           text: radio.querySelector(".chakra-radio__label").textContent.trim(),
//           id: radio.querySelector("input").id,
//         })
//       );
//       required = control.querySelector('input[type="radio"]').required;
//     } else if (control.querySelector(".chakra-checkbox")) {
//       type = "checkbox";
//       options = Array.from(control.querySelectorAll(".chakra-checkbox")).map(
//         (checkbox) => ({
//           text: checkbox
//             .querySelector(".chakra-checkbox__label")
//             .textContent.trim(),
//           id: checkbox.querySelector("input").id,
//         })
//       );
//       required = control.querySelector('input[type="checkbox"]').required;
//     } else if (control.querySelector("select")) {
//       type = "select";
//       options = Array.from(control.querySelectorAll("option")).map(
//         (option) => ({
//           text: option.textContent.trim(),
//           value: option.value,
//         })
//       );
//     } else if (control.querySelector('input[type="tel"]')) {
//       type = "phone";
//     } else if (control.querySelector(".chakra-input__group")) {
//       type = "dropdown";
//     } else if (control.querySelector("input")) {
//       type = "text";
//     }

//     questions.push({
//       number: questionNumber,
//       text: questionText,
//       type: type,
//       options: options,
//       id: id,
//       required: required,
//     });
//   });

//   return questions;
// }

function categorizeQuestions() {
  const formHtml = document.body.innerHTML; // Or the specific form HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(formHtml, "text/html");
  const questions = doc.querySelectorAll(".chakra-form-control");

  const categorizedQuestions = [];

  questions.forEach((question, index) => {
    const questionNumber = index + 1;
    const labelElement = question.querySelector(".chakra-form__label");
    const questionText = labelElement ? labelElement.textContent.trim() : "";

    let questionType = "text"; // Default type
    let options = [];
    let inputId = "";
    let otherOption = null;

    // Check for radio buttons
    const radioGroup = question.querySelector(".chakra-radio-group");
    if (radioGroup) {
      questionType = "radio";
      const radioButtons = Array.from(
        radioGroup.querySelectorAll(".chakra-radio")
      );
      options = radioButtons.map((radio) => {
        const input = radio.querySelector("input");
        const label = radio.querySelector(".chakra-radio__label");
        return {
          id: input.id,
          value: label.textContent.trim(),
        };
      });

      // Check for "Other" option with input
      const otherRadio = radioButtons.find(
        (radio) =>
          radio
            .querySelector(".chakra-radio__label")
            .textContent.trim()
            .toLowerCase() === "others"
      );
      if (otherRadio) {
        const otherInput = otherRadio.nextElementSibling.querySelector("input");
        if (otherInput) {
          otherOption = {
            optionId: otherRadio.querySelector("input").id,
            inputId: otherInput.id,
          };
        }
      }

      inputId = radioGroup.id || options[0].id.split("-")[0];
    }

    // ... [Keep the existing code for checkboxes and dropdowns] ...

    // If it's a normal input (text, email, tel, etc.)
    if (questionType === "text") {
      const input = question.querySelector("input, textarea");
      if (input) {
        inputId = input.id;
        questionType = input.type || "text";
      }
    }

    // Check if the question is optional
    const isOptional = questionText.toLowerCase().includes("(optional)");

    categorizedQuestions.push({
      number: questionNumber,
      text: questionText,
      type: questionType,
      id: inputId,
      options: options.length > 0 ? options : undefined,
      otherOption: otherOption,
      isOptional: isOptional,
    });
  });

  return categorizedQuestions;
}
