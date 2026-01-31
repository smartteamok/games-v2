import { mazeApp } from "./maze/mazeApp";
import { mazeVerticalApp } from "./maze-vertical/mazeVerticalApp";
import { practiceApp } from "./practice/practiceApp";
import { artistApp } from "./artist/artistApp";
import type { AppDefinition } from "./types";

export const apps: AppDefinition<unknown>[] = [
  mazeApp,
  mazeVerticalApp,
  practiceApp,
  artistApp
] as AppDefinition<unknown>[];

export const getDefaultApp = (): AppDefinition<unknown> => apps[0];

export const getAppById = (id: string): AppDefinition<unknown> | undefined =>
  apps.find((app) => app.id === id);
