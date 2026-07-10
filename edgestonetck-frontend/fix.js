const fs = require('fs');

const path = 'd:/Project/Ticket/EdgeStone_Tck_Front_End/edgestonetck-frontend/src/pages/dashboard/TicketReplyView.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\n    const handleRefresh = async \(\) => \{[\s\S]*?    \};\n\n    const \[showCircuitModal, setShowCircuitModal\] = useState\(false\);\n    const \[selectedCircuit, setSelectedCircuit\] = useState\(\(\) => \{\n        return localStorage\.getItem\(`confirmed_circuit_id_\$\{ticket\.id\}`\) \|\| ticket\.circuitId \|\| 'BA\/SNG-TY2\/ESPL-003';\n    \}\);\n    const \[selectedPriority, setSelectedPriority\] = useState\(''\);\n    const \[openDropdown, setOpenDropdown\] = useState<'circuit' \| 'priority' \| null>\(null\);\n    const \[replyText, setReplyText\] = useState\(''\);\n    const \[showEmailModal, setShowEmailModal\] = useState\(false\);\n    const \[replies, setReplies\] = useState<Reply\[\]>\(\[\]\);\n    const \[attachments, setAttachments\] = useState<File\[\]>\(\[\]\);\n/g;

// I will just use regex to remove the FIRST instance of the handleRefresh to attachments state if there are multiple.
// Wait, actually I will just use a more foolproof script.
