import type { Response } from "express";

type Props = {
  error?: string;
};

export function login(res: Response, props: Props = {}): void {
  res.render("login", {
    title: "Login",
    layout: "layout",
    ...props,
  });
}
