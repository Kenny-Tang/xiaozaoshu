# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 blog application that converts Markdown files to HTML for web preview. The application dynamically loads articles from the `public/articles/` directory and displays them using a custom Markdown previewer with syntax highlighting, copy buttons for code blocks, and a table of contents.

## Architecture

- **Framework**: Vue 3 with Composition API
- **UI Library**: Element Plus
- **Markdown Processing**: markdown-it with highlight.js for syntax highlighting
- **Routing**: Vue Router with dynamic route loading from `public/links.json`
- **Build Tool**: Vite

The application has a dynamic routing system that reads article configurations from `public/links.json` to generate navigation menus and routes. Articles are stored as Markdown files in `public/articles/` and are converted to HTML on the fly.

## Key Components

- `App.vue`: Main application layout with collapsible sidebar and dynamic menu loading
- `MdViewer.vue`: Component for displaying Markdown content with TOC generation
- `MarkdownPreview.vue`: Core component that renders Markdown content with syntax highlighting, copy buttons, and TOC
- `router/index.js`: Dynamic route loader that reads from `public/links.json`

## File Structure

- `public/articles/`: Contains Markdown articles that get converted to web pages
- `public/links.json`: Configuration file defining navigation items and routes
- `src/components/`: Reusable Vue components
- `src/views/`: Page-level Vue components
- `src/router/`: Routing configuration with dynamic loading

## Development Commands

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build production-ready application
- `npm run preview` - Preview production build locally

## Article Management

To add a new article:
1. Create a Markdown file in `public/articles/`
2. Add an entry to `public/links.json` with:
   - `name`: Display name in the sidebar
   - `path`: Route path for the article
   - `url`: Path to the Markdown file
   - `icon`: Icon to display (optional, supports "Document", "House")
   - `component`: Component to render (typically "MdViewer")

The application will automatically generate the route and navigation menu item based on this configuration.

## Special Features

- Automatic table of contents generation from Markdown headings
- Syntax highlighting for code blocks with copy buttons
- Front matter YAML parsing support
- Collapsible sidebar navigation
- Responsive design