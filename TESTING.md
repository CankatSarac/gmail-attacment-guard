# 🧪 Gmail Attachment Guard - Testing Guide

## 🚀 Quick Start Testing

### 1. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **"Load unpacked"**
4. Select the `gmail-attachment-guard` folder
5. Verify the extension appears in your extensions list

### 2. Basic Functionality Test

1. **Go to Gmail** (gmail.com)
2. **Click Compose** to start a new email
3. **Type a message** mentioning attachments:
   ```
   Hi there,
   
   Please find the attached document for your review.
   
   Best regards
   ```
4. **Click Send** - You should see the attachment warning dialog
5. **Test both buttons**: "Add Attachment" and "Send Anyway"

## ☕ Coffee Popup Testing

### Test Scenario 1: Page Load Trigger (10% chance)
```javascript
// Open Browser Console (F12) and run:
localStorage.removeItem('gag-coffee-last-shown');
location.reload();
// The coffee popup has a 10% chance to appear after 5 seconds
```

### Test Scenario 2: Force Coffee Popup
```javascript
// Open Browser Console (F12) and run:
localStorage.removeItem('gag-coffee-last-shown');
maybeTriggerCoffeePopup();
// This will show the popup if you pass the 30% random chance
```

### Test Scenario 3: Guaranteed Coffee Popup
```javascript
// Open Browser Console (F12) and run:
localStorage.removeItem('gag-coffee-last-shown');
showBuyMeCoffeePopup();
// This will show the popup immediately
```

### Test Scenario 4: Email Send Trigger
1. **Send 5 successful emails** (without attachment warnings)
2. **On the 5th send**, coffee popup has 30% chance to appear
3. **Force test**: Run in console:
   ```javascript
   pageInteractionCount = 4; // Set to 4
   // Now send one more email, it will trigger the coffee popup logic
   ```

### Test Scenario 5: Rate Limiting
```javascript
// Test the 3-day rate limiting:
localStorage.setItem('gag-coffee-last-shown', Date.now().toString());
maybeTriggerCoffeePopup(); // Should NOT show popup
showBuyMeCoffeePopup(); // Should show popup (bypasses rate limit)
```

## 🎯 Detailed Test Cases

### Attachment Detection Tests

#### Test Case 1: English Keywords
```
Subject: Document Review
Body: Please see the attached file for details.
Expected: Warning dialog appears
```

#### Test Case 2: Turkish Keywords
```
Subject: Belge İncelemesi
Body: Lütfen ekteki dosyayı inceleyin.
Expected: Warning dialog appears
```

#### Test Case 3: Multiple Languages
```
Subject: Files
Body: I'm attaching the résumé and附件 for review.
Expected: Warning dialog appears
```

#### Test Case 4: False Positives (Should NOT trigger)
```
Subject: Meeting
Body: I'll attach the meeting notes to the wall.
Expected: No warning (contextually not about email attachments)
```

### UI/UX Tests

#### Coffee Popup Behavior
1. **Auto-hide Test**: Popup disappears after 10 seconds
2. **Click Test**: Clicking coffee button opens link and hides popup
3. **Close Test**: X button closes popup
4. **Conflict Test**: Attachment dialog hides coffee popup

#### Dialog Functionality
1. **Keyboard Navigation**: Tab between buttons, Enter to activate, Esc to close
2. **Click Outside**: Clicking overlay closes dialog
3. **Accessibility**: Screen reader compatibility
4. **Mobile Responsive**: Test on different screen sizes

## 🔧 Developer Testing Tools

### Console Commands for Testing

```javascript
// 1. Reset all data
localStorage.removeItem('gag-coffee-last-shown');
pageInteractionCount = 0;

// 2. Force coffee popup
showBuyMeCoffeePopup();

// 3. Force attachment dialog
showConfirmationDialog(
  document.querySelector('[data-tooltip*="Send"]'),
  () => console.log('Send anyway clicked'),
  () => console.log('Add attachment clicked')
);

// 4. Test localization
console.log(getLocalizedMessage('attachmentKeywords'));

// 5. Check popup state
console.log('Coffee popup exists:', !!buyMeCoffeePopup);
console.log('Warning dialog exists:', !!currentWarningDialog);

// 6. Simulate page interactions
pageInteractionCount = 4; // Next send will trigger coffee logic

// 7. Test time-based logic
const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
localStorage.setItem('gag-coffee-last-shown', threeDaysAgo.toString());
```

### Extension Debugging

1. **Check Extension Console**:
   - Go to `chrome://extensions/`
   - Click "Details" on Gmail Attachment Guard
   - Click "Inspect views: background page" (if any)

2. **Check Content Script Console**:
   - Open Gmail
   - Press F12 to open DevTools
   - Look for "Attachment Guard:" messages in console

3. **Check for Errors**:
   - Look for red error messages in console
   - Check Network tab for failed resource loads

## 📊 Test Results Checklist

### ✅ Basic Functionality
- [ ] Extension loads without errors
- [ ] Attachment detection works for all supported languages
- [ ] Warning dialog appears when expected
- [ ] Dialog buttons work correctly
- [ ] Dialog closes on Esc key or overlay click

### ✅ Coffee Popup Features
- [ ] Popup appears in top-right corner
- [ ] Beautiful gradient design displays correctly
- [ ] Auto-hide after 10 seconds works
- [ ] Close button (X) works
- [ ] Coffee button opens link in new tab
- [ ] Rate limiting prevents spam (3-day minimum)
- [ ] Popup hides when attachment dialog appears

### ✅ Edge Cases
- [ ] Multiple sends don't break the system
- [ ] Page reload doesn't cause errors
- [ ] Works with Gmail's dynamic loading
- [ ] No conflicts with other extensions
- [ ] Memory leaks are avoided (popups properly cleaned up)

### ✅ Browser Compatibility
- [ ] Works in Chrome (primary)
- [ ] Works in Edge (Chromium-based)
- [ ] Icons display correctly
- [ ] CSS animations work smoothly

## 🐛 Common Issues & Solutions

### Issue: Extension not loading
**Solution**: Check manifest.json syntax, verify all files exist

### Issue: Coffee popup not appearing
**Solution**: 
```javascript
// Check rate limiting
console.log(localStorage.getItem('gag-coffee-last-shown'));
// Check random chance (try multiple times)
for(let i = 0; i < 10; i++) { maybeTriggerCoffeePopup(); }
```

### Issue: Attachment detection not working
**Solution**: Check Gmail DOM structure changes, verify selectors in dom_utils.js

### Issue: Popup styling broken
**Solution**: Check CSS file loading, verify !important declarations

## 📈 Performance Testing

### Memory Usage
```javascript
// Monitor memory usage
console.log('Extensions memory:', performance.memory);
// Check for memory leaks after multiple popup shows/hides
```

### Load Time
```javascript
// Check script loading time
console.time('Extension Load');
// ... extension loads ...
console.timeEnd('Extension Load');
```

## 🎨 Visual Testing

1. **Take Screenshots** of:
   - Coffee popup in different states
   - Attachment warning dialog
   - Different language versions

2. **Test Animations**:
   - Coffee popup slide-in effect
   - Dialog fade-in effect
   - Hover effects on buttons

3. **Responsive Design**:
   - Test on different screen sizes
   - Verify mobile Gmail compatibility

## 📝 Test Documentation

Create a test log with:
- Test date and time
- Browser version
- Gmail interface version
- Test results and any issues found
- Screenshots of successful tests

This comprehensive testing approach ensures your extension works perfectly across all scenarios!
