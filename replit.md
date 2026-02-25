# GreenhouseManager - Greenhouse Farm Management App

## Overview
A mobile application for greenhouse farm observation management built with Expo Router + Express backend.

## Features
- **6 Observation Categories**: Virus, Auxiliaire, Ravageurs, Irrigation, Inspection, Compteur
- **Each category has its own form** with proper validation and reusable components
- **Dashboard** with category cards and quick stats
- **History tab** showing recent observations
- **Reusable form components**: Dropdown, MultiSelect, RadioGroup, ImagePicker, DateTimePicker, TextInput
- **ApiService** with placeholder methods ready for backend integration

## Architecture

### Frontend (Expo/React Native)
- `app/(tabs)/index.tsx` - Home dashboard with 6 category cards
- `app/(tabs)/history.tsx` - History/recent observations
- `app/observations/virus.tsx` - Virus observation form
- `app/observations/auxiliaire.tsx` - Auxiliaire observation form
- `app/observations/ravageurs.tsx` - Ravageurs observation form
- `app/observations/irrigation.tsx` - Irrigation observation form
- `app/observations/inspection.tsx` - Inspection form with dynamic blocks
- `app/observations/compteur.tsx` - Compteur form

### Reusable Components
- `components/forms/FormDropdown.tsx` - Modal-based dropdown
- `components/forms/FormMultiSelect.tsx` - Multi-select with checkboxes
- `components/forms/FormRadioGroup.tsx` - Radio button group
- `components/forms/FormImagePicker.tsx` - Single & multi image picker
- `components/forms/FormDateTimePicker.tsx` - Custom date/time picker
- `components/forms/FormTextInput.tsx` - Styled text input
- `components/forms/FormSection.tsx` - Form section wrapper
- `components/forms/FarmSecteurSerreSelect.tsx` - Chained farm/secteur/serre selects
- `components/forms/FormSubmitButton.tsx` - Animated submit button
- `components/CategoryCard.tsx` - Home screen category cards

### Data Models & Services
- `models/index.ts` - All TypeScript types and interfaces
- `services/ApiService.ts` - Placeholder API methods with TODO comments
- `services/mockData.ts` - Mock data for farms, serres, observation types

### Backend (Express)
- `server/index.ts` - Express server (port 5000)
- `server/routes.ts` - API routes (to be populated with backend integration)

## Design
- Theme: Deep forest green (#1A6B3C) with mint accents
- Font: Poppins (400, 500, 600, 700)
- Clean card-based UI with subtle shadows
- Native tab bar with liquid glass support on iOS 26+
- Consistent form patterns across all 6 observation types

## Workflows
- **Start Backend**: `npm run server:dev` (port 5000)
- **Start Frontend**: `npm run expo:dev` (port 8081)

## Future Integration Points
- All `ApiService.ts` methods are marked with `// API integration point` comments
- Mock data in `services/mockData.ts` should be replaced with real API calls
- Offline sync layer can be added via AsyncStorage pending queue
- Image upload via multipart/form-data is prepared in ApiService comments
