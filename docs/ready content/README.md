# Fashion Design Learning Platform - Ready Content

This folder contains the structured JSON content for the fashion design learning platform.

## Files

- `stage-1.json` through `stage-8.json` - Stage content with lessons, quizzes, and games
- `terms.json` - Aggregated glossary terms across all stages

## Content Model

Each stage JSON contains:
- `id`, `order`, `title`, `description` - Stage metadata
- `lessons[]` - Array of lesson objects with id, title, body, exercise, and terms
- `quiz` - Questions array with passThreshold
- `game` - Game configuration with type and config

## Usage

Content is loaded dynamically via the `useContentStore` in the application.