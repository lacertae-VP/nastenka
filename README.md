# School Notice Board

This project is a web application designed to serve as a notice board for a school, allowing for the management of students, teachers, and events. It provides a platform for displaying current and past events, as well as managing student and teacher information.

## Project Structure

The project is organized into two main directories: `src/backend` and `src/frontend`.

### Backend

- **app.js**: Initializes the Express application, sets up middleware, and connects to the database.
- **server.js**: Starts the server and listens for incoming requests.
- **config/database.js**: Contains the database connection logic and configuration settings.
- **controllers**: Contains the logic for handling requests related to events, students, teachers, and attendance.
  - `eventController.js`
  - `studentController.js`
  - `teacherController.js`
  - `attendanceController.js`
- **models**: Defines the data models for events, students, teachers, and attendance.
  - `Event.js`
  - `Student.js`
  - `Teacher.js`
  - `Attendance.js`
- **routes**: Defines the API routes for handling requests.
  - `eventRoutes.js`
  - `studentRoutes.js`
  - `teacherRoutes.js`
  - `attendanceRoutes.js`
- **middleware/auth.js**: Contains authentication and authorization middleware.

### Frontend

- **index.html**: The main entry point for the frontend application.
- **css**: Contains stylesheets for the application.
  - `style.css`
  - `responsive.css`
- **js**: Contains JavaScript files for frontend logic.
  - `main.js`
  - `events.js`
  - `users.js`
  - `api.js`
- **pages**: Contains HTML pages for different sections of the application.
  - `events.html`
  - `students.html`
  - `teachers.html`
  - `dashboard.html`

### Database

- **schema.sql**: Contains the SQL schema for setting up the database, including tables for events, students, teachers, and attendance.

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd school-notice-board
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up the database:
   - Create a database and run the SQL commands in `src/database/schema.sql`.

4. Configure environment variables:
   - Copy `.env.example` to `.env` and update the values as needed.

5. Start the server:
   ```
   npm start
   ```

## Usage

- Access the application in your web browser at `http://localhost:3000`.
- Use the navigation to view events, students, teachers, and the dashboard.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or features.

## License

This project is licensed under the MIT License.