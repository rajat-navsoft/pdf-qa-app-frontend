# Frontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.27.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
# pdf-qa-app

This app lets you upload company PDFs (policies, handbooks and so on) and ask questions about them in plain English. Instead of reading a 50-page HR policy, you type "How many days of paid leave do I get?" and get a short answer that names the page it came from.

The three parts
Frontend (Angular, frontend/): the web page you use. It has the upload area, the document list, the chat for one document, and the floating chatbot. It doesn't do any of the thinking; it sends your requests to the backend and shows the replies.

Backend (FastAPI in Python, backend/): the server on port 8000. It receives uploads, stores them, searches them and builds the answers.

The LLM (through OpenRouter): an AI model running on someone else's server. The backend sends it some text and a question, and it writes the reply.

What happens when you upload a PDF
The backend:

Saves the file.
Pulls the text out of each page.
Cuts the text into small pieces of about 1000 characters ("chunks").
Turns each chunk into a list of numbers that represents its meaning. This is called an embedding, and a small AI model on your machine produces it. Chunks about similar topics get similar numbers.
Stores those chunks and numbers in ChromaDB, a database built for "find things similar to this". It also writes a simple record (name, size, pages) to SQLite, which is what fills the document list.
What happens when you ask a question
The question is turned into numbers the same way.
ChromaDB finds the 4 chunks whose meaning is closest to the question, for example the paragraph about leave policy.
The backend sends only those 4 chunks and your question to the LLM, with the instruction: "answer using only these excerpts; if the answer isn't there, say so."
The LLM writes the answer, and you see it with the page numbers it came from.
This approach is called RAG (retrieval-augmented generation): first find the relevant text, then have the AI write an answer from it.

Why do it this way?
The AI can't read your files on its own. It only knows what was in its training data. RAG hands it the right pages at the moment you ask.
Whole documents are too big to send every time. Sending only the 4 relevant chunks keeps it fast and cheap.
It's less likely to make things up, because it's told to use only the excerpts, and the page numbers let you check the answer.
The two chat modes
The main chat panel asks about the one document you've selected.
The floating chatbot searches across every uploaded document and remembers the conversation, so follow-ups like "what about sick leave?" work.
In short, it's a search engine for your PDFs that answers in sentences instead of giving you a list of links. The README I added has the same explanation with more technical detail.