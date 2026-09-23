const input = prompt("Enter a number:");

const number = Number(input);

if (input === null || input.trim() === "" || !Number.isFinite(number)) {
  console.error("Error: Please enter a valid number.");
} else {
  console.log(`Multiplication Table of ${number}`);

  for (let i = 1; i <= 10; i++) {
    console.log(`${number} × ${i} = ${number * i}`);
  }
}
