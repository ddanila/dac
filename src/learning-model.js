// Original museum lesson text; historical programs run unchanged.
export const lessonVersion=1;
export const sampleLetter='DEAR FRIEND,\r\rTODAY I USED A ROBOTRON COMPUTER.\rI SAVED THIS LETTER ON A FLOPPY DISK.\r\rGREETINGS FROM THE MUSEUM\r';
export const workdaySteps=[
 {id:'boot',title:'Wake the workstation',instruction:'Start the private workstation and wait for its A> prompt.',hint:'The ROM loads the operating system from disk A. Waiting is part of the original experience.',journey:'boot',scenario:'cold'},
 {id:'write',title:'Write a letter',instruction:'At A>, enter WS LETTER.TXT. Write your letter in WordStar. Use the sample letter if you prefer.',hint:'WordStar uses control keys. The buttons below send real keyboard input, including Ctrl+K followed by D.',journey:'video',scenario:'historical'},
 {id:'save',title:'Save your words',instruction:'Press Ctrl+K, then D to save. Wait for the WordStar opening menu.',hint:'Saving changes the private disk. The museum checks that LETTER.TXT contains text; an onscreen message alone is not enough.',journey:'disk',scenario:'write'},
 {id:'reopen',title:'Read it back',instruction:'From the WordStar menu press D, enter LETTER.TXT, and press Enter. See your saved words again.',hint:'The check looks for the document title and saved text in the reopened editor.',journey:'disk',scenario:'dir'},
 {id:'copy',title:'Make a second copy',instruction:'Save and exit the document (Ctrl+K, D), then X to leave WordStar. At A>, enter PIP B:LETTER.TXT=A:LETTER.TXT.',hint:'B: names the second drive. Success requires identical file bytes on both private disks.',journey:'disk',scenario:'write'},
 {id:'print',title:'Put the letter on paper',instruction:'At A>, enter PIP LST:=LETTER.TXT. Inspect the paper preview and export it.',hint:'LST: sends bytes to the printer receiver. This is a generic paper preview, not a specific printer model.',journey:'disk',scenario:'print'}
];
export const levels={Visitor:'What is happening and why it matters.',Learner:'Follow the software, devices, and stored bytes.',Engineer:'Inspect the actual observations, identities, code, and timing.'};
export function documentText(bytes){return Array.from(bytes,b=>String.fromCharCode(b&127)).join('').split('\x1a')[0].replace(/\r/g,'');}
export function workdayEvidence({screen,source,destination,printer,completed}){
 const text=documentText(source),line=text.split('\n').find(s=>s.trim().length>0)?.trim(),p=documentText(printer);
 const editor=/^\s*A:LETTER\.TXT\s+PAGE\s+\d+\s+LINE/.test(screen.split('\n')[0]);
 const equal=source.length>0&&source.length===destination.length&&source.every((v,i)=>v===destination[i]);
 return [/(?:^|\n)A>$/.test(screen),editor&&screen.split('\n').slice(10).some(s=>/[A-Za-z0-9]/.test(s)),source.length>0&&!!line&&screen.includes('EDITING NO FILE')&&screen.includes('S  RUN SPELLSTAR'),editor&&!!line&&screen.includes(line.slice(0,60))&&completed.includes('save'),equal&&/(?:^|\n)A>$/.test(screen)&&completed.includes('reopen'),!!line&&p===text&&/(?:^|\n)A>$/.test(screen)&&completed.includes('copy')];
}
