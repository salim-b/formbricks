import { useState } from "react";
import { cn } from "@formbricks/lib/cn";
import type { NPSQuestion } from "@formbricks/types/questions";
import Headline from "./Headline";
import Subheader from "./Subheader";
import SubmitButton from "@/components/preview/SubmitButton";

interface NPSQuestionProps {
  question: NPSQuestion;
  onSubmit: (data: { [x: string]: any }) => void;
  lastQuestion: boolean;
  brandColor: string;
}

export default function NPSQuestion({ question, onSubmit, lastQuestion, brandColor }: NPSQuestionProps) {
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);

  const handleSelect = (number: number) => {
    setSelectedChoice(number);
    if (question.required) {
      setSelectedChoice(null);
      onSubmit({
        [question.id]: number,
      });
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        const data = {
          [question.id]: selectedChoice,
        };

        setSelectedChoice(null);
        onSubmit(data);
        // reset form
      }}>
      <Headline headline={question.headline} questionId={question.id} />
      <Subheader subheader={question.subheader} questionId={question.id} />
      <div className="my-4">
        <fieldset>
          <legend className="sr-only">Options</legend>
          <div className="flex">
            {Array.from({ length: 11 }, (_, i) => i).map((number) => (
              <label
                key={number}
                className={cn(
                  selectedChoice === number ? "z-10 border-slate-400 bg-slate-50" : "",
                  "relative h-10 flex-1 cursor-pointer border bg-white text-center text-sm  leading-10 first:rounded-l-md last:rounded-r-md hover:bg-gray-100 focus:outline-none"
                )}>
                <input
                  type="radio"
                  name="nps"
                  value={number}
                  className="absolute h-full w-full cursor-pointer opacity-0"
                  onClick={() => handleSelect(number)}
                  required={question.required}
                />
                {number}
              </label>
            ))}
          </div>
          <div className="flex justify-between px-1.5 text-xs leading-6 text-slate-500">
            <p>{question.lowerLabel}</p>
            <p>{question.upperLabel}</p>
          </div>
        </fieldset>
      </div>
      {!question.required && (
        <div className="mt-4 flex w-full justify-between">
          <div></div>
          <SubmitButton {...{ question, lastQuestion, brandColor }} />
        </div>
      )}
    </form>
  );
}
