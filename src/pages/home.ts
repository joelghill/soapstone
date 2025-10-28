import type { Response } from "express";

export function home(res: Response): void {
  res.render("home", {
    title: "Home",
    layout: "layout",
  });
}
