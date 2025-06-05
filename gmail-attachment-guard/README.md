# 📎 Gmail Attachment Guard

A modern Chrome extension that warns you when you mention attachments in Gmail but forget to actually attach files. Now with beautiful UI, multi-language support, and a "Buy me a coffee" feature!

## ✨ Features

### 🎯 Core Functionality
- **Smart Detection**: Automatically detects when you mention attachments in email body or subject
- **Multi-Language Support**: Works in 15 languages with culturally appropriate keywords
- **Modern UI**: Beautiful, Gmail-integrated dialog design with accessibility support
- **Buy Me Coffee**: Elegant popup to support the developer

### 🌍 Supported Languages
- **English** - attachment, file, document, resume, CV, etc.
- **Turkish** - ek, dosya, belge, CV, özgeçmiş, etc.
- **Spanish** - adjunto, archivo, documento, currículum, etc.
- **French** - pièce jointe, fichier, document, CV, etc.
- **German** - anhang, datei, dokument, lebenslauf, etc.
- **Italian** - allegato, file, documento, curriculum, etc.
- **Portuguese** - anexo, arquivo, documento, currículo, etc.
- **Dutch** - bijlage, bestand, document, CV, etc.
- **Russian** - вложение, файл, документ, резюме, etc.
- **Japanese** - 添付, ファイル, 書類, 履歴書, etc.
- **Korean** - 첨부, 파일, 문서, 이력서, etc.
- **Chinese (Simplified)** - 附件, 文件, 文档, 简历, etc.
- **Chinese (Traditional)** - 附件, 檔案, 文件, 履歷, etc.
- **Arabic** - مرفق, ملف, وثيقة, سيرة ذاتية, etc.
- **Hindi** - अटैचमेंट, फाइल, दस्तावेज, बायोडाटा, etc.

## 🚀 Installation

1. **Download/Clone** this repository
2. Open **Chrome** and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **"Load unpacked"** and select the extension folder
5. The extension will now be active on Gmail!

## 🎨 New UI Features

### Modern Attachment Warning
- Beautiful modal overlay with blur effect
- Gmail-style buttons and typography
- Warning emoji and clear messaging
- Keyboard navigation support (Esc to close)
- Smooth animations

### Buy Me Coffee Popup
- Elegant top-right corner popup with gradient background
- Auto-appears occasionally (respects user preferences)
- Rate-limited to avoid annoyance (max once every 3 days)
- Disappears when attachment dialog is shown
- Beautiful slide-in animation

## 🛠️ How It Works

1. **Content Script** monitors Gmail compose areas
2. **Smart Detection** scans email text for attachment keywords in the user's language
3. **Intelligent Blocking** prevents email sending when attachments are mentioned but missing
4. **User Choice** provides options to either add attachment or send anyway
5. **Coffee Support** occasionally shows support popup to help maintain the extension

## 🎯 Configuration

### Buy Me Coffee Settings
- Popup appears with 30% chance when conditions are met
- Minimum 3-day interval between shows
- Automatically hidden when user interacts with attachment warnings
- Link can be customized in `ui_handlers.js`

### Keyword Customization
Edit the `attachmentKeywords` in any `_locales/[language]/messages.json` file to add your own keywords.

## 🔧 Development

### File Structure
```
gmail-attachment-guard/
├── manifest.json              # Extension manifest
├── _locales/                 # Internationalization
│   ├── en/messages.json      # English translations
│   ├── tr/messages.json      # Turkish translations
│   └── ...                   # 13 more languages
├── js/
│   ├── content_script.js     # Main Gmail integration
│   ├── ui_handlers.js        # Dialog & popup UI
│   ├── attachment_logic.js   # Detection logic
│   ├── dom_utils.js          # Gmail DOM utilities
│   └── i18n_utils.js         # Localization utilities
├── css/
│   └── styles.css            # Modern UI styling
└── icons/                    # Extension icons
```

### Key Components

#### Content Script (`content_script.js`)
- Monitors Gmail send button clicks
- Triggers coffee popup occasionally
- Manages send blocking/allowing logic

#### UI Handlers (`ui_handlers.js`)
- Creates modern attachment warning dialog
- Manages buy me coffee popup
- Handles all user interactions and animations

#### Attachment Logic (`attachment_logic.js`)
- Multi-language keyword detection
- Email content parsing
- Attachment presence verification

## 🎨 Styling

The extension uses modern CSS with:
- Google Sans/Roboto font family
- Gmail-style colors and spacing
- Smooth animations and transitions
- High contrast accessibility
- Mobile-friendly responsive design

## 🐛 Troubleshooting

### Extension Not Loading
- Check Chrome Extensions page for errors
- Verify all files are present
- Check browser console for JavaScript errors

### Detection Not Working
- Ensure you're composing in Gmail (not other email services)
- Check if keywords match your language
- Verify compose area is properly detected

### Coffee Popup Issues
- Check localStorage for rate limiting
- Verify popup CSS is loading correctly
- Check console for JavaScript errors

## 📱 Browser Support

- **Chrome**: Full support (primary target)
- **Edge**: Should work with Chromium-based Edge
- **Opera**: Should work with Chrome extension compatibility
- **Firefox**: Not currently supported (different manifest format)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your improvements
4. Test thoroughly in Gmail
5. Submit a pull request

### Adding New Languages
1. Create new folder in `_locales/[language_code]/`
2. Copy `en/messages.json` as template
3. Translate all messages and keywords
4. Test with Gmail in that language

## 📄 License

MIT License - feel free to use and modify!

## ☕ Support the Developer

If this extension saves you from embarrassing "forgot attachment" moments, consider buying me a coffee! The popup will occasionally appear to remind you, but you can also support directly anytime.

---

**Made with ❤️ for Gmail users worldwide**