# RTL (Arabic/English) Implementation Guide

This project now supports full RTL (Right-to-Left) layout for Arabic language, along with LTR (Left-to-Right) for English.

## What's Been Implemented

### Core Infrastructure
1. **i18next Configuration** (`src/i18n/config.ts`)
   - Automatic language detection from localStorage
   - English and Arabic translation support
   - Browser language detection fallback

2. **Translation Files**
   - `src/i18n/locales/en.json` - English translations
   - `src/i18n/locales/ar.json` - Arabic translations
   - Comprehensive translations for all UI elements

3. **RTL CSS Support** (`src/index.css`)
   - Automatic direction switching based on language
   - RTL-specific font family for Arabic
   - Text alignment adjustments

4. **Language Switcher Component** (`src/components/LanguageSwitcher.tsx`)
   - User-friendly language selection dropdown
   - Automatic direction update on language change
   - Persists language preference in localStorage

### Components Updated
- ✅ **Sidebar** - Fully translated with RTL support
- ✅ **Dashboard** - Fully translated with RTL support
- ✅ **LanguageSwitcher** - New component for language selection
- ✅ **App** - Auto-detects and sets document direction

## How to Use Translations

### 1. Import the useTranslation Hook

```tsx
import { useTranslation } from 'react-i18next';

export function YourComponent() {
  const { t } = useTranslation();
  // ... rest of your component
}
```

### 2. Replace Hardcoded Text with Translation Keys

**Before:**
```tsx
<h1>Dashboard</h1>
<p>Welcome back!</p>
```

**After:**
```tsx
<h1>{t('dashboard.title')}</h1>
<p>{t('dashboard.welcome')}</p>
```

### 3. Using Variables in Translations

For dynamic content, use interpolation:

**Translation file:**
```json
{
  "dashboard.welcome": "Welcome back! Here's what's happening in {{department}}"
}
```

**Component:**
```tsx
<p>{t('dashboard.welcome', { department: currentDepartment?.name })}</p>
```

### 4. Add RTL-aware Classes

For elements that need different alignment in RTL:

```tsx
<div className="text-left rtl:text-right">
  {/* Content */}
</div>
```

Common RTL utility classes:
- `rtl:text-right` - Right-align text in RTL mode
- `rtl:text-left` - Left-align text in RTL mode
- `ltr:ml-2 rtl:mr-2` - Margin adjustments for RTL

## Component Implementation Pattern

Here's the standard pattern for updating components:

```tsx
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Page title */}
      <h1>{t('myComponent.title')}</h1>

      {/* Description */}
      <p>{t('myComponent.description')}</p>

      {/* Buttons with RTL-aware text alignment */}
      <button className="text-left rtl:text-right">
        {t('common.save')}
      </button>

      {/* Dynamic content */}
      <p>{t('myComponent.greeting', { name: user?.name })}</p>

      {/* Conditional text */}
      {items.length === 0 ? (
        <p>{t('myComponent.noItems')}</p>
      ) : (
        <p>{t('myComponent.itemCount', { count: items.length })}</p>
      )}
    </div>
  );
}
```

## Translation File Structure

All translations are organized by feature/component:

```json
{
  "common": {
    "search": "Search",
    "save": "Save",
    "cancel": "Cancel"
  },
  "nav": {
    "dashboard": "Dashboard",
    "myFiles": "My Files"
  },
  "dashboard": {
    "title": "Dashboard",
    "welcome": "Welcome back!"
  }
}
```

## Components That Need Translation

The following components still need to be updated with translations. Use the pattern above:

### High Priority
1. **MyFiles** (`src/components/MyFiles.tsx`)
2. **Correspondences** (`src/components/Correspondences.tsx`)
3. **TaskContext** (`src/components/TaskContext.tsx`)
4. **Settings** (`src/components/Settings.tsx`)

### Medium Priority
5. **RetentionDashboard** (`src/components/RetentionDashboard.tsx`)
6. **ActivityAuditLog** (`src/components/ActivityAuditLog.tsx`)
7. **TaskDetailsTab** (`src/components/TaskDetailsTab.tsx`)
8. **TaskWorkflowTab** (`src/components/TaskWorkflowTab.tsx`)
9. **TaskDiagramTab** (`src/components/TaskDiagramTab.tsx`)
10. **TaskEdit** (`src/components/TaskEdit.tsx`)

### Low Priority
11. **Starred** (`src/components/Starred.tsx`)
12. **SharedFiles** (`src/components/SharedFiles.tsx`)
13. **Archived** (`src/components/Archived.tsx`)
14. **Trash** (`src/components/Trash.tsx`)
15. **GlobalSearchModal** (`src/components/GlobalSearchModal.tsx`)

## Adding New Translations

When adding translations for a new component:

1. Add keys to both `en.json` and `ar.json` in the same structure
2. Use descriptive key names: `componentName.elementPurpose`
3. Keep the structure consistent between languages
4. Test both languages to ensure proper layout

### Example: Adding Translations for a New Component

**src/i18n/locales/en.json:**
```json
{
  "myNewComponent": {
    "title": "New Component",
    "description": "This is a description",
    "actionButton": "Take Action",
    "noData": "No data available"
  }
}
```

**src/i18n/locales/ar.json:**
```json
{
  "myNewComponent": {
    "title": "مكون جديد",
    "description": "هذا وصف",
    "actionButton": "اتخاذ إجراء",
    "noData": "لا توجد بيانات متاحة"
  }
}
```

## Testing RTL Layout

1. Open the application
2. Click the language switcher in the sidebar (bottom section)
3. Select "العربية" to switch to Arabic/RTL
4. Verify:
   - Text direction is right-to-left
   - Icons and buttons are properly positioned
   - Menus and dropdowns open in the correct direction
   - Text alignment is appropriate

## Best Practices

1. **Always use translation keys** - Never hardcode user-facing text
2. **Test both languages** - Check layout in both English and Arabic
3. **Use semantic keys** - Make translation keys descriptive and organized
4. **RTL-aware spacing** - Use `rtl:` prefix for directional utilities
5. **Icon placement** - Consider icon position in RTL (often needs mirroring)
6. **Numbers and dates** - Use appropriate formatting for each locale

## Common RTL Issues and Solutions

### Issue: Text cut off or misaligned
**Solution:** Add `rtl:text-right` class to containers

### Issue: Icons on wrong side
**Solution:** Use conditional classes:
```tsx
<div className="flex items-center gap-2 ltr:flex-row rtl:flex-row-reverse">
```

### Issue: Margins/padding wrong direction
**Solution:** Use logical properties:
```tsx
<div className="ltr:ml-4 rtl:mr-4">
```

### Issue: Dropdown menus open on wrong side
**Solution:** Add directional positioning:
```tsx
<div className="absolute ltr:left-0 rtl:right-0">
```

## Language Persistence

The selected language is automatically saved to localStorage and will persist across sessions. The key used is `i18nextLng`.

## Browser Language Detection

If no language preference is saved, the system will:
1. Check localStorage for previous selection
2. Fall back to browser language
3. Default to English if no match found

## Additional Resources

- [i18next Documentation](https://www.i18next.com/)
- [React i18next](https://react.i18next.com/)
- [Tailwind RTL Support](https://tailwindcss.com/docs/hover-focus-and-other-states#rtl-support)

## Support

For questions or issues with RTL implementation, please refer to this guide or check the implemented components (Sidebar, Dashboard) for reference patterns.
