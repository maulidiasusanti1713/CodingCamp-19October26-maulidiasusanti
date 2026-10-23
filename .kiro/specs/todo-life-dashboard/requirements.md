# Requirements Document

## Introduction

The To-Do List Life Dashboard is a standalone client-side web application that serves as a personal productivity hub. It combines a contextual greeting with current time and date, a Pomodoro-style focus timer, a persistent to-do list, and a customizable quick links panel — all stored in the browser's Local Storage with no backend required. The app is built with HTML, CSS, and vanilla JavaScript, and must run in all modern browsers.

## Glossary

- **Dashboard**: The single-page web application that hosts all widgets.
- **Greeting_Widget**: The section of the Dashboard displaying the current time, date, and a time-based greeting message.
- **Focus_Timer**: The countdown timer widget set to 25 minutes, with start, stop, and reset controls.
- **Task**: A single to-do item that can be created, edited, marked complete, or deleted.
- **Task_List**: The widget that manages the collection of Tasks.
- **Quick_Link**: A saved URL and label pair that opens a website in a new browser tab.
- **Quick_Links_Panel**: The widget that manages the collection of Quick_Links.
- **Local_Storage**: The browser's built-in `localStorage` API used to persist all user data client-side.
- **User**: The person interacting with the Dashboard in a web browser.

---

## Requirements

### Requirement 1: Time and Date Display

**User Story:** As a User, I want to see the current time and date at a glance, so that I always know when I am without switching tabs.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM format (24-hour clock, where HH is 00–23 and MM is 00–59), updated every second.
2. THE Greeting_Widget SHALL display the current date in the format "DayOfWeek, Month Day, Year" (e.g., "Monday, January 6, 2025"), using full day and month names and a four-digit year.
3. WHEN the local time is between 05:00 and 11:59, THE Greeting_Widget SHALL display the message "Good morning".
4. WHEN the local time is between 12:00 and 17:59, THE Greeting_Widget SHALL display the message "Good afternoon".
5. WHEN the local time is between 18:00 and 20:59, THE Greeting_Widget SHALL display the message "Good evening".
6. WHEN the local time is between 21:00 and 23:59 or between 00:00 and 04:59, THE Greeting_Widget SHALL display the message "Good night".

---

### Requirement 2: Focus Timer

**User Story:** As a User, I want a 25-minute countdown timer with start, stop, and reset controls, so that I can time focused work sessions without relying on an external app.

#### Acceptance Criteria

1. WHEN the Dashboard page loads, THE Focus_Timer SHALL initialize and display 25:00.
2. WHEN the User activates the start control and the Focus_Timer is not already counting down, THE Focus_Timer SHALL begin counting down one second per second from the currently displayed time.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL update the displayed time every second in MM:SS format.
4. WHEN the User activates the stop control and the Focus_Timer is counting down, THE Focus_Timer SHALL pause the countdown and retain the remaining time.
5. WHEN the User activates the reset control, THE Focus_Timer SHALL stop any active countdown and return the display to 25:00.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and enter a visually distinct state that differs from both the running and idle states.

---

### Requirement 3: Task Management

**User Story:** As a User, I want to add, edit, complete, and delete tasks in a to-do list, so that I can track and manage my personal or work activities from a single page.

#### Acceptance Criteria

1. WHEN the User submits a non-empty task name of 1 to 200 characters, THE Task_List SHALL add the new Task to the list and persist it to Local_Storage.
2. IF the User submits an empty task name, THEN THE Task_List SHALL reject the submission and display an inline validation message adjacent to the input field; the message SHALL be cleared when the User enters a non-empty value.
3. IF the User submits a task name exceeding 200 characters, THEN THE Task_List SHALL reject the submission and display an inline validation message indicating the character limit.
4. WHEN the User activates the edit control on a Task, THE Task_List SHALL replace the Task's displayed text with a text input field pre-populated with the Task's current text.
5. WHEN the User saves an edited Task with a non-empty name of 1 to 200 characters, THE Task_List SHALL update the Task's text, restore the display to non-editable state, and persist the change to Local_Storage.
6. IF the User saves an edited Task with an empty name, THEN THE Task_List SHALL retain the original Task text and restore the display to non-editable state without modifying Local_Storage.
7. WHEN the User activates the complete control on a Task, THE Task_List SHALL toggle the Task's completed state and persist the change to Local_Storage.
8. WHEN the User activates the delete control on a Task, THE Task_List SHALL remove the Task from the list and persist the change to Local_Storage.
9. WHEN the Dashboard loads, THE Task_List SHALL restore all previously saved Tasks from Local_Storage, preserving their text and completed state.
10. WHILE a Task's completed state is true, THE Task_List SHALL render the Task's text with a strikethrough style and at 50% opacity to distinguish it from incomplete Tasks.

---

### Requirement 4: Quick Links Management

**User Story:** As a User, I want to save and access my favorite website links directly from the Dashboard, so that I can navigate to frequently used sites with a single click.

#### Acceptance Criteria

1. WHEN the User submits a URL that begins with `http://` or `https://` followed by at least one non-whitespace character and a non-empty label of 1–50 characters, THE Quick_Links_Panel SHALL add the Quick_Link to the panel and persist it to Local_Storage.
2. IF the User submits a label that is empty or exceeds 50 characters, or a URL that does not begin with `http://` or `https://` followed by at least one non-whitespace character, THEN THE Quick_Links_Panel SHALL reject the submission and display an inline validation message indicating which field failed and why.
3. WHEN the User activates a Quick_Link button, THE Quick_Links_Panel SHALL open the associated URL in a new browser tab.
4. WHEN the User activates the delete control on a Quick_Link, THE Quick_Links_Panel SHALL remove the Quick_Link from the panel and persist the change to Local_Storage.
5. WHEN the Dashboard loads, THE Quick_Links_Panel SHALL restore all previously saved Quick_Links from Local_Storage in the order they were originally added.
6. IF the User attempts to add a Quick_Link when 20 Quick_Links are already saved, THEN THE Quick_Links_Panel SHALL reject the submission and display an inline message indicating the maximum limit of 20 links has been reached.
7. IF Local_Storage is unavailable or contains data that cannot be parsed as a valid Quick_Links collection, THEN THE Quick_Links_Panel SHALL display an empty panel and display an error message indicating that saved links could not be loaded.

---

### Requirement 5: Data Persistence

**User Story:** As a User, I want my tasks and quick links to be automatically saved and restored between sessions, so that I never lose my data when I close or refresh the browser.

#### Acceptance Criteria

1. THE Dashboard SHALL use the browser Local_Storage API as the sole data persistence mechanism.
2. WHEN any Task or Quick_Link is created, updated, or deleted, THE Dashboard SHALL synchronously write the current state to Local_Storage before returning control to the User.
3. WHEN Local_Storage is unavailable or throws an error during a write, THE Dashboard SHALL display a non-blocking banner message that does not prevent user interaction and continue operating with in-memory state.
4. THE Dashboard SHALL store all Task and Quick_Link data under keys prefixed with `lifedb_` (e.g., `lifedb_tasks`, `lifedb_links`) to avoid collisions with other applications using Local_Storage.
5. WHEN the Dashboard loads, THE Dashboard SHALL read all Task and Quick_Link data from Local_Storage and render the restored state before the User can interact with any widget.

---

### Requirement 6: Layout and Visual Design

**User Story:** As a User, I want a clean, visually organized dashboard layout, so that I can find and use each widget quickly without confusion.

#### Acceptance Criteria

1. THE Dashboard SHALL present all widgets — Greeting_Widget, Focus_Timer, Task_List, and Quick_Links_Panel — on a single HTML page without requiring navigation.
2. THE Dashboard SHALL apply a typographic scale where widget headings are rendered at a font size at least 1.5× larger than the body text font size.
3. THE Dashboard SHALL use a single external CSS file located at `css/` and a single external JavaScript file located at `js/` for all styling and behaviour respectively.
4. WHILE the viewport width is 768 pixels or wider, THE Dashboard SHALL display widgets in a two-column grid layout.
5. WHILE the viewport width is below 768 pixels, THE Dashboard SHALL display widgets in a single-column stacked layout.
6. THE Dashboard SHALL be operable using only a keyboard (Tab, Enter, Space, Escape) for all interactive controls, where each focusable element displays a visible focus indicator when it receives keyboard focus.
7. THE Dashboard SHALL render each widget within a visually distinct container separated from adjacent widgets by a minimum of 16 pixels of whitespace on all sides.

---

### Requirement 7: Performance and Compatibility

**User Story:** As a User, I want the Dashboard to load quickly and work reliably across modern browsers, so that I can use it as my default new-tab page or bookmark without friction.

#### Acceptance Criteria

1. THE Dashboard SHALL load and become fully interactive within 3 seconds, measured from navigation start to the point where all UI elements respond to user input, when loaded from local storage or a local file system with no external network requests at runtime.
2. THE Dashboard SHALL function correctly in the current stable release of Chrome, Firefox, Edge, and Safari, where "function correctly" means all acceptance criteria defined for other requirements pass without error or visual defect in each browser.
3. THE Dashboard SHALL use no external JavaScript frameworks or libraries; all behaviour SHALL be implemented in vanilla JavaScript with no runtime fetches to third-party script hosts.
4. THE Dashboard SHALL require no backend server; all resources, including HTML, CSS, JavaScript, and any asset files, SHALL be served as static files loadable by opening the HTML file directly in a browser.
5. WHEN the Dashboard is opened in a browser that does not support a Web API required for core functionality, THE Dashboard SHALL display a message indicating which browser features are unsupported and that a supported browser is required.
