# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.
# SIH

## Running the Project Locally

To run this application on your local machine using Visual Studio Code, please follow these steps.

### Prerequisites

*   **Node.js**: Make sure you have Node.js (version 18 or later recommended) installed.
*   **npm**: This project uses npm for package management. It comes bundled with Node.js.

### 1. Install Dependencies

First, you need to install all the required packages listed in `package.json`. Open your terminal in the root directory of the project and run:

```bash
npm install
```

### 2. Set Up Environment Variables

The application requires API keys for various services to function correctly.

1.  Create a new file named `.env` in the root of your project.
2.  Copy the following content into your `.env` file and replace the placeholder values with your actual credentials.

```
# Google Maps API Key (for GIS Atlas and Aerial View)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY"

# Gemini API Key (for all AI features)
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Twilio Credentials (for sending SMS alerts)
TWILIO_ACCOUNT_SID="YOUR_TWILIO_ACCOUNT_SID"
TWILIO_AUTH_TOKEN="YOUR_TWILIO_AUTH_TOKEN"
TWILIO_PHONE_NUMBER="YOUR_TWILIO_PHONE_NUMBER"
```

### 3. Run the Development Servers

This project requires two separate terminal sessions to run concurrently: one for the Next.js frontend and one for the Genkit AI flows.

**Terminal 1: Start the Next.js Frontend**

In your first terminal, run the following command to start the main application:

```bash
npm run dev
```

This will start the Next.js development server, typically on `http://localhost:9002`.

**Terminal 2: Start the Genkit AI Server**

In a second terminal, run this command to start the server for the AI assistant and other generative features:

```bash
npm run genkit:watch
```

This starts the Genkit flows and will automatically restart if you make any changes to the AI-related files.

Once both servers are running, you can open your browser and navigate to `http://localhost:9002` to see your application in action.
