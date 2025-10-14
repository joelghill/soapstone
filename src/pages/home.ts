import type { Post } from "#/lib/repositories/entities";
import { html } from "../lib/view";
import { shell } from "./shell";

type Props = {
  posts: Post[];
  didHandleMap: Record<string, string>;
  profile?: { displayName?: string };
};

export function home(props: Props) {
  return shell({
    title: "Home",
    content: content(props),
  });
}

function content({ posts, didHandleMap, profile }: Props) {
  return html`<div id="root">
    <div class="error"></div>
    <div id="header">
      <h1>SOAPSTONE</h1>
    </div>
    <div class="container">
      <div class="card">
        ${profile
          ? html`<form action="/logout" method="post" class="session-form">
              <div>
                Hi, <strong>${profile.displayName || "friend"}</strong>.
              </div>
              <div>
                <button type="submit">Log out</button>
              </div>
            </form>`
          : html`<div class="session-form">
              <div><a href="/login">Log in</a> to post and view posts!</div>
              <div>
                <a href="/login" class="button">Log in</a>
              </div>
            </div>`}
      </div>
      ${posts.map((post, i) => {
        const handle = didHandleMap[post.authorDid] || post.authorDid;
        const date = formatDate(post.createdAt);
        const location = formatLocation(post.location);
        return html`
          <div class=${i === 0 ? "post-line no-line" : "post-line"}>
            <div class="post-content">
              <div class="post-text">${post.text}</div>
              <div class="post-location">${location}</div>
            </div>
            <div class="post-meta">
              <a class="author" href=${toBskyLink(handle)}>@${handle}</a>
              <span class="post-date">${date}</span>
            </div>
          </div>
        `;
      })}
    </div>
  </div>`;
}

function toBskyLink(handle: string) {
  return `https://bsky.app/profile/${handle}`;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

function formatLocation(location: any) {
  if (location && location.coordinates) {
    const [longitude, latitude] = location.coordinates;
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
  return "Unknown location";
}
