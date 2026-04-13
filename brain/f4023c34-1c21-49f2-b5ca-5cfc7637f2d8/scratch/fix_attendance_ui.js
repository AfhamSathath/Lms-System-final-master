const fs = require('fs');
const path = 'e:\\Lms-System-final-master\\frontend\\src\\pages\\lecturer\\subjectAttendanceSessions.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /<button onClick={handleSaveMarks}[\s\S]*?<\/button>/;
const match = content.match(regex);

if (match) {
    console.log('Found match:', JSON.stringify(match[0]));
    const replacement = `{activeSession.status === 'draft' && (
                 ${match[0]}
               )}`;
    content = content.replace(regex, replacement);
    fs.writeFileSync(path, content);
    console.log('Successfully updated the file.');
} else {
    console.log('Regex match not found.');
}
