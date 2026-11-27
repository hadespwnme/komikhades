# Infinity Chapter Append-on-Scroll

## Goal

Make Infinity Chapter append the next chapter below the current one while scrolling, and remove configurable chapter delays.

## Design

- `ReaderClient` owns the infinity toggle and the list of rendered chapter sections.
- The current chapter is rendered immediately. When infinity is enabled and the sentinel near the end becomes visible, the client requests the next chapter's pages from a small server route and appends them below the existing pages.
- The client repeats this for each subsequent chapter until the comic ends.
- Turning infinity off collapses the reader back to the initially opened chapter; the normal previous/next buttons remain available.
- `FloatingDock` keeps the toggle and auto-scroll controls but no longer renders instant/3-second/5-second delay choices.
- Progress tracking records the chapter and page currently visible, including appended chapters.

## Failure behavior

- A failed chapter request leaves existing content intact and shows a retry control at the sentinel.
- The last chapter stops requesting more content.
- The existing normal chapter navigation remains unchanged when infinity is off.

## Verification

- Assert the old delay state/options are gone and the append route exists.
- Run TypeScript/Next build and inspect the production reader route.
