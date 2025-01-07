document.addEventListener("DOMContentLoaded",()=> {

    //HTML elements used for altering/adding more elements in functions
    const questionText = document.getElementById("question");
    const nextButton = document.getElementById("next-btn");
    const startButton = document.getElementById("start-btn");
    const catSelect = document.getElementById("categories");
    const answersSection = document.getElementById("options");
    const alertSection = document.getElementById("alerts");
    const resetButton = document.getElementById("reset-btn");
    const quizSection = document.getElementById("quiz-section");

    let score= 0;
    let questions= [];
    let questionIndex=0;


    /**
     * Fetching designated question from which category user chooses
     * @param quizAPI URL to specific quiz JSON based on category choice
     * @returns {Promise<void>}
     */
    async function getQuestion(quizAPI) {
        const response = await fetch(quizAPI);
        const data = await response.json();
        updateQuestion(data);
    }

    /**
     * Displays specified question from selected quiz, shuffles answers, and manages any features inside quiz-section div.
     */
    function updateQuestion() {
        const question=questions[questionIndex];
        questionText.innerText = decodeHTML(question.question);

        answersSection.innerHTML="";
        const answers = [...question.incorrect_answers, question.correct_answer];

        answers.sort(()=> Math.random() - 0.5); //referenced ChatGPT to figure out simple answer shuffling

        //creating button options for each possible answer
        answers.forEach((answer) => {
            const button = document.createElement("button");
            button.innerText = decodeHTML(answer);

            button.classList.add("choices");
            alertSection.innerHTML = ""; //clearing any previous alerts

            //adding Bootstrap alerts and score update based on correct or incorrect answer
            button.addEventListener("click", () => {
                if(answer===question.correct_answer){
                    score++;
                    document.getElementById("score").innerText = `Score: ${score}`;
                    console.log("Correct!");

                    const success = document.createElement("div");
                    success.className = "alert alert-success";
                    success.role = "alert";
                    success.innerText = "Correct!";
                    alertSection.appendChild(success);

                }else{
                    console.log(`incorrect answer; the correct answer is ${question.correct_answer}`);

                    const incorrectAnswer = document.createElement("div");
                    incorrectAnswer.className = "alert alert-danger";
                    incorrectAnswer.role = "alert";
                    incorrectAnswer.innerHTML = `Incorrect; the correct answer is <strong>${decodeHTML(question.correct_answer)}</strong>`;
                    alertSection.appendChild(incorrectAnswer);

                }

                //disable button click once user has selected a choice
                const allButtons = document.querySelectorAll(".choices");
                allButtons.forEach(btn => btn.disabled = true);

                //ensuring next button is on a "new line" or stacked
                nextButton.style.display="block";
            });
            answersSection.appendChild(button); //visually adding buttons for each option to already existing HTML element
        });
    }


    /**
     * Fetches all category options from OpenTriviaDB API for user selection
     * @returns {Promise<void>}
     */
    async function getCategory() {
        const catURL = "https://opentdb.com/api_category.php"; //fetching categories from Open Trivia API
        const response = await fetch(catURL);
        const catData = await response.json();
        updateCategories(catData);
    }

    /**
     * Function will display all possible category choices in a Select HTML element
     * @param catData represents Category Data retrieved from the fetch in getCategory()
     */
    function updateCategories(catData) {
        catData.trivia_categories.forEach((item) => { //displaying user category selections
            const option = document.createElement("option");
            option.value = item.id;
            option.text = item.name;
            catSelect.appendChild(option);
        });
    }

    /**
     * Handles click event for starting a quiz after a choice for category is selected
     * If no designated category selected, quiz questions will be random categories as a default.
     */
    startButton.addEventListener("click", ()=>{
        const catStart = catSelect.value;
        //validate input
        const quizAPI = `https://opentdb.com/api.php?amount=10&category=${catStart}`;
        document.getElementById("quiz-section").style.display="block";
        getQuiz(quizAPI);

    });

    /**
     * Function handling for click event; will proceed to the next question after user has made an answer choice.
     */
    nextButton.addEventListener("click", ()=>{
        questionIndex++; //increment index for question[] array
        nextButton.style.display="none";

        if(questionIndex<questions.length){ //ensure that there are still questions left to ask
            updateQuestion();

        }else{ //questions have run out; results and reset quiz button displayed
            console.log("you've completed the quiz! Try another?")
            restartGame();
            //add a reset button
        }

    });


    /**
     * Handler for click event function that allows the user to play another game.
     */
    resetButton.addEventListener("click", ()=>{
        score=0; //reset index and score for new round
        questionIndex=0;
        questions=[];


        document.getElementById("score").innerText = `Score: ${score}`;
        resetButton.style.display="none";
        nextButton.style.display="none";
        catSelect.value = "";
        questionText.innerText = "";
        answersSection.innerHTML = "";
        alertSection.innerHTML = "";
        startButton.style.display = "inline";
        quizSection.style.display="none";

    });


    /**
     * Will take place once a quiz ends. Displays user's results and rank.
     */
    function restartGame(){
        let rank = "";
        if(score<=3) rank = "Quiz Noob";
        else if(score<=6) rank = "Quizlet Apprentice"
        else if(score<=8) rank = "Quizzard";
        else rank = "Ultimate Quizzler";

        //inform user of their rank and score
        const scoreResults = document.createElement("div");
        scoreResults.className = "alert alert-dark";
        scoreResults.role = "alert";
        scoreResults.innerHTML = `Quiz Completed! Your Score: ${score}/10<br>Rank: <strong>${rank}</strong>`;
        alertSection.appendChild(scoreResults);
        resetButton.style.display="block";
    }



    /**
     * Fetches proper Quiz data for questions, answers, and number of questions based on quizAPI
     * @param quizAPI URL designated for whichever category user has specified
     * @returns {Promise<void>}
     */
    async function getQuiz(quizAPI) {
        try{
            const response = await fetch(quizAPI);
            if(!response.ok){
                throw new Error(response.statusText);
            }
            const quizData = await response.json();
            createQuiz(quizData);

        }catch(error){ //fetch too quickly or too many times before questions load/if user tries to restart game via start button after results
            console.log(error.message);
            alert("unable to fetch questions");
        }
    }

    /**
     * Function takes in quizData and sets questions array to contain the data in the array
     * If there are not enough questions for a category topic, console will send a message
     * @param quizData contains the designated data for quiz questions based on category
     */
    function createQuiz(quizData){
        questions = quizData.results;

        if(!questions||questions.length === 0){
            console.log("no questions available");
            return;
        }
        updateQuestion();
    }


    /**
     * Decoding function to make &amp in JSON questions readable; referenced from StackOverflow
     * https://stackoverflow.com/questions/7394748/whats-the-right-way-to-decode-a-string-that-has-special-html-entities-in-it
     * @param data takes in data needed to be decoded
     * @returns {string} readable form of data
     */
    function decodeHTML(data) {
        const textArea = document.createElement("textarea");
        textArea.innerHTML = data;
        return textArea.value;
    }


    getCategory(); //call to getCategory will enact each function necessary to have the quiz working.
});