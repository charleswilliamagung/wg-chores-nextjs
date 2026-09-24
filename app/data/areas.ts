import { Task } from "../types";

export const areas: Record<string, Task[]> = {
  hallway: [
    {
      name: "Vacuum & mop floor",
      week3Only: false,
    },
    {
      name: "Kitchen trash",
      week3Only: false,
    },
    {
      name: "Clean shoe rack",
      week3Only: true,
    },
    {
      name: "Wash rugs",
      week3Only: true,
    },
  ],

  kitchen: [
    {
      name: "Floor",
      week3Only: false,
    },
    {
      name: "Clean surfaces",
      week3Only: false,
    },
    {
      name: "Glass trash",
      week3Only: false,
    },
    {
      name: "Stove / Fridge",
      week3Only: true,
    },
    {
      name: "Microwave / Kettle",
      week3Only: true,
    },
  ],

  bathroom: [
    {
      name: "Floor",
      week3Only: false,
    },
    {
      name: "Clean surfaces",
      week3Only: false,
    },
    {
      name: "Paper trash",
      week3Only: false,
    },
    {
      name: "Floor rug",
      week3Only: true,
    },
    {
      name: "Toilet & shower",
      week3Only: true,
    },
  ],
};