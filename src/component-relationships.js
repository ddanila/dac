import data from './robotron-relationships.json' with {type:'json'};
export const relationshipsFor=name=>data.groups.filter(g=>g.members.includes(name));
