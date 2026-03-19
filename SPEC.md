# DailyLog AI MVP - Specification

## Project Overview
- **Name**: DailyLog AI
- **Type**: Web Application (Next.js 14 + Tailwind CSS)
- **Core Functionality**: Voice-first daily field reporting app for contractors with recording, transcription, categorization, and export capabilities
- **Target Users**: Field contractors, construction workers, project managers

## UI/UX Specification

### Layout Structure
- **Mobile-first design** optimized for field use
- **Header**: App title + current project name + settings icon
- **Main Content**: Tab-based navigation (Record | Logs | Archive)
- **Bottom Navigation**: Fixed tab bar for mobile
- **Responsive Breakpoints**:
  - Mobile: < 640px (primary)
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

### Visual Design
- **Color Palette**:
  - Primary: `#0F766E` (teal-700) - main actions, headers
  - Secondary: `#134E4A` (teal-900) - dark accents
  - Accent: `#F59E0B` (amber-500) - recording indicator, warnings
  - Background: `#F8FAFC` (slate-50) - page background
  - Surface: `#FFFFFF` - cards, modals
  - Text Primary: `#1E293B` (slate-800)
  - Text Secondary: `#64748B` (slate-500)
  - Danger: `#DC2626` (red-600) - delete, errors
  - Success: `#16A34A` (green-600) - confirmations

- **Typography**:
  - Font Family: `"DM Sans"` for headings, `"IBM Plex Sans"` for body
  - Headings: 24px (h1), 20px (h2), 16px (h3)
  - Body: 14px regular, 14px medium
  - Small: 12px

- **Spacing System**: 4px base unit (4, 8, 12, 16, 24, 32, 48)

- **Visual Effects**:
  - Card shadows: `0 1px 3px rgba(0,0,0,0.1)`
  - Buttons: 8px border-radius
  - Recording pulse animation (amber glow)
  - Smooth transitions: 200ms ease

### Components

#### 1. Header Bar
- App logo/title left-aligned
- Project selector dropdown center
- Settings gear icon right
- Height: 56px
- Background: white with subtle bottom border

#### 2. Project Selector
- Dropdown with project list
- Add new project button
- Project names: "Project A", "Project B", "Project C" (sample)
- Stored in localStorage

#### 3. Voice Recording Interface
- Large circular record button (80px diameter)
- States: idle (teal), recording (amber with pulse), processing (spinner)
- Waveform visualization during recording (simulated bars)
- Timer display showing recording duration
- "Tap to record" / "Tap to stop" labels

#### 4. AI Transcription Display
- Card showing transcribed text
- Edit button to manually adjust
- Confidence indicator (fake "98% accuracy")
- Simulated transcription placeholder text

#### 5. Category Selection
- 4 category chips: Delays | Safety | Materials | Issues
- Multi-select enabled
- Selected: filled teal, Unselected: outlined gray
- Icons for each category (emoji)

#### 6. Save Button
- Large primary button below category selection
- Text: "Save Log Entry"
- Disabled until transcription exists

#### 7. Daily Log Viewer (Logs Tab)
- List of entries for selected date
- Each entry shows: time, category icons, preview text (truncated)
- Tap to expand full entry
- Swipe to delete (with confirmation)

#### 8. Date Picker
- Calendar icon button in header
- Opens modal with month view
- Highlight days with entries
- Default: today

#### 9. Archive/Search (Archive Tab)
- Search input at top
- Filter by category chips
- List of all entries (paginated)
- Tap entry to view full details

#### 10. Export Functionality
- Export button in entry detail view
- Options: PDF, Text
- Generate downloadable file
- For MVP: simple text/print view

## Functionality Specification

### Core Features

1. **Voice Recording**
   - Use Web Speech API (SpeechRecognition)
   - Fallback: manual text entry if API unavailable
   - Simulated transcription for demo (random contractor phrases)
   - Max recording: 5 minutes

2. **Data Storage**
   - localStorage for all data
   - Data structure:
     ```json
     {
       "projects": ["Project A", "Project B", "Project C"],
       "currentProject": "Project A",
       "logs": [
         {
           "id": "uuid",
           "projectId": "Project A",
           "date": "2024-01-15",
           "time": "09:30",
           "transcription": "...",
           "categories": ["delays", "safety"],
           "createdAt": "timestamp"
         }
       ]
     }
     ```

3. **Project Management**
   - Create new project
   - Switch between projects
   - Delete project (with confirmation)

4. **Log Management**
   - Create log entry with voice/text
   - Categorize entry
   - Edit entry
   - Delete entry
   - View by date

5. **Search & Filter**
   - Full-text search across transcriptions
   - Filter by category
   - Filter by date range

6. **Export**
   - Text export: plain text format
   - PDF export: simple HTML print-to-PDF
   - Export single entry or date range

### User Interactions & Flows

1. **Recording Flow**:
   - User selects project → taps record → speaks → stops → sees transcription → selects categories → saves

2. **Viewing Flow**:
   - User selects date → sees list of entries → taps entry → sees full details

3. **Search Flow**:
   - User goes to Archive → types search → sees filtered results → taps entry

### Edge Cases
- No speech API: show manual entry option
- Empty project: prompt to create one
- No logs for date: show empty state
- localStorage full: show warning

## Acceptance Criteria

1. ✅ App loads without errors
2. ✅ Can create and switch between projects
3. ✅ Voice recording button works (or fallback text entry)
4. ✅ Transcription displays after recording
5. ✅ Can select multiple categories
6. ✅ Log saves to localStorage
7. ✅ Can view logs by date
8. ✅ Can search/filter logs
9. ✅ Can export to text
10. ✅ Responsive on mobile and desktop