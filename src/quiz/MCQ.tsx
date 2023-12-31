"use client";
import React from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/card";
import { Button, buttonVariants } from "../components/button";
import { differenceInSeconds } from "date-fns";
import { BarChart, ChevronRight, Loader2, Timer } from "lucide-react";
import { checkAnswerSchema, endGameSchema } from "../components/questions";
import { cn, formatTimeDelta } from "../utils";
import MCQCounter from "./MCQCounter";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useToast } from "../components/use-toast";
import stringSimilarity from "string-similarity";
import Statistics from "../statistics/Statistics";

const MCQ = ({ game, form, timeStarted }: any) => {
  const [questionIndex, setQuestionIndex] = React.useState(0);
  const [quiz, setQuiz] = React.useState(game);
  const [timer, setTimer] = React.useState<any>();
  const [hasEnded, setHasEnded] = React.useState(false);
  const [stats, setStats] = React.useState({
    correct_answers: 0,
    wrong_answers: 0,
  });
  const [selectedChoice, setSelectedChoice] = React.useState<number>(0);
  const [now, setNow] = React.useState(new Date());
  console.log(now, timeStarted, (game.timeStarted, now))

  const currentQuestion = React.useMemo(() => {
    return game[questionIndex];
  }, [questionIndex, game]);

  const options = React.useMemo(() => {
    if (!currentQuestion) return [];
    // if (!currentQuestion.options) return [];
    // return JSON.parse(currentQuestion.options as string) as string[];
    let opt = [currentQuestion.option1, currentQuestion.option2, currentQuestion.option3]
    return opt;
  }, [currentQuestion]);

  const { toast } = useToast();
  const { mutate: checkAnswer, isLoading: isChecking } = useMutation({
    mutationFn: async () => {

      let filledAnswer = "blankAnswer";
      let userInput = ''
      document.querySelectorAll("#user-blank-input").forEach((input: any) => {
        filledAnswer = filledAnswer.replace("_____", input.value);
        userInput = input.value
        input.value = "";
      });



      if (currentQuestion.questionType === "mcq") {
        const isCorrect = currentQuestion.answer.toLowerCase().trim()
         === userInput.toLowerCase().trim();
        setQuiz(function(game: any) {
          if (game[currentQuestion]) {
            game[currentQuestion].isCorrect = isCorrect
            game[currentQuestion].userAnswer = userInput.toLowerCase().trim()
            if (isCorrect) game[currentQuestion].percentageCorrect = 100
            if (!isCorrect) game[currentQuestion].percentageCorrect = 0
          }
          return {
            // counter: state.counter + props.increment
          };
        });
    } else if (currentQuestion.questionType === "open_ended") {
      let percentageSimilar = stringSimilarity.compareTwoStrings(
        currentQuestion.answer.toLowerCase().trim(),
        userInput.toLowerCase().trim()
      );
      percentageSimilar = Math.round(percentageSimilar * 100);
    }
      // const response = await axios.post(`/api/checkAnswer`, payload);
      const response = { data: {} }
      return response.data;
    },
  });

  const { mutate: endGame } = useMutation({
    mutationFn: async () => {
      const payload: z.infer<typeof endGameSchema> = {
        gameId: game.id,
      };
      // const response = await axios.post(`/api/endGame`, payload);
      const response = { data: {} }
      return response.data;
    },
  });

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!hasEnded) {
        setNow(new Date());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [hasEnded]);

  const handleNext = React.useCallback(() => {
    checkAnswer(undefined, {
      onSuccess: ({ isCorrect }: any) => {
        if (isCorrect) {
          setStats((stats) => ({
            ...stats,
            correct_answers: stats.correct_answers + 1,
          }));
          toast({
            title: "Correct",
            description: "You got it right!",
            variant: "success",
          });
        } else {
          setStats((stats) => ({
            ...stats,
            wrong_answers: stats.wrong_answers + 1,
          }));
          toast({
            title: "Incorrect",
            description: "You got it wrong!",
            variant: "destructive",
          });
        }
        if (questionIndex === game.length - 1) {
          endGame();
          setHasEnded(true);
          
          setTimer(formatTimeDelta(differenceInSeconds(now, timeStarted)))
          return;
        }
        setQuestionIndex((questionIndex) => questionIndex + 1);
      },
    });
  }, [checkAnswer, questionIndex, game.length, toast, endGame]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key;

      if (key === "1") {
        setSelectedChoice(0);
      } else if (key === "2") {
        setSelectedChoice(1);
      } else if (key === "3") {
        setSelectedChoice(2);
      } else if (key === "4") {
        setSelectedChoice(3);
      } else if (key === "Enter") {
        handleNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleNext]);

  const millisToMinutesAndSeconds = (millis: any) => {
      const minutes = Math.floor(millis / 60000);
      const seconds = parseInt(((millis % 60000) / 1000).toFixed(0));
    //ES6 interpolated literals/template literals 
      //If seconds is less than 10 put a zero in front.
      let msg = `${minutes} ${minutes === 1 ? "minute" : "minutes"} ${(seconds < 10 ? "0" : "")}${seconds} ${seconds === 1 ? "second" : "seconds"}`
      return msg;
  }
  if (hasEnded) {
    return (
      <div className="absolute flex flex-col justify-center -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
        <div className="px-4 py-2 mt-2 font-semibold text-white bg-green-500 rounded-md whitespace-nowrap">
          You Completed in{" "}
          {millisToMinutesAndSeconds(Math.abs(new Date(timeStarted).getTime() - new Date(now).getTime()))} 
        </div>
        <Statistics
        timeEnded={now}
        timeStarted={timeStarted}
        game={game} 
        />
      </div>
    );
  }

  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 md:w-[80vw] max-w-4xl w-[90vw] top-1/2 left-1/2">
      <div className="flex flex-row justify-between">
        <div className="flex flex-col">
          {/* topic */}
          <p>
            <span className="text-slate-400">Topic</span> &nbsp;
            <span className="px-2 py-1 text-white rounded-lg bg-slate-800">
              {form.topic}
            </span>
          </p>
          <div className="flex self-start mt-3 text-slate-400">
            <Timer className="mr-2" />
            {formatTimeDelta(differenceInSeconds(now, timeStarted))}
          </div>
        </div>
        <MCQCounter
          correct_answers={stats.correct_answers}
          wrong_answers={stats.wrong_answers}
        />
      </div>
      <Card className="w-full mt-4">
        <CardHeader className="flex flex-row items-center">
          <CardTitle className="mr-5 text-center divide-y divide-zinc-600/50">
            <div>{questionIndex + 1}</div>
            <div className="text-base text-slate-400">
              {game.length}
            </div>
          </CardTitle>
          <CardDescription className="flex-grow text-lg">
            {currentQuestion?.question}
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="flex flex-col items-center justify-center w-full mt-4">
        
        {options.map((option, index) => {
          return (
            <Button
              key={option}
              variant={selectedChoice === index ? "default" : "outline"}
              className="justify-start w-full py-8 mb-4"
              onClick={() => setSelectedChoice(index)}
            >
              <div className="flex items-center justify-start">
                <div className="p-2 px-3 mr-5 border rounded-md">
                  {index + 1}
                </div>
                <div className="text-start">{option}</div>
              </div>
            </Button>
          );
        })}
        <Button
          variant="default"
          className="mt-2"
          size="lg"
          disabled={isChecking || hasEnded}
          onClick={() => {
            handleNext();
          }}
        >
          {isChecking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Next <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default MCQ;
