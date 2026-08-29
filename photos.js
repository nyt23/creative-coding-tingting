/* One entry per place. Add or remove freely.

     src    image path — leave empty ('') for a placeholder rectangle
     place  name, shown on the print and large when it opens
     line   one sentence, shown when it opens              ← edit me
     meta   small print — date, neighbourhood, etc.          ← edit me
     size   'sm' | 'md' | 'lg'
     pin    'tape' | 'pin' | 'none'
     rot    tilt in degrees; leave unset for a stable random pick
     top, left  position on the paper, in %; leave unset to auto-place
     focus  which part of a wide photo to keep, e.g. '68% 50%'
*/

window.WORK_TITLE = 'Berlin, As Found';
window.WORK_SUB   = 'a few places, kept';

window.SPOTS = [

  { src:'photos/brandenburg-gate-berlin.jpg',
    place:'Brandenburg Gate',
    line:'A doorway with nothing to keep out anymore, so everyone just walks through it.',
    meta:'Mitte',
    size:'lg', pin:'tape' },

  { src:'photos/tv-tower.jpg',
    place:'Fernsehturm',
    line:'You can see it from nearly anywhere, which is the point of a tower.',
    meta:'Mitte',
    size:'lg', pin:'pin' },

  { src:'photos/berlin-reichstag.jpg',
    place:'Reichstag',
    line:'A glass dome so you can watch the government from above, or the other way round.',
    meta:'Tiergarten',
    focus:'68% 50%',
    size:'md', pin:'tape' },

  { src:'photos/tiergarten.jpg',
    place:'Tiergarten',
    line:'A straight line of trees, and at the end of it, gold.',
    meta:'Tiergarten',
    size:'md', pin:'tape' },

  { src:'photos/kurfürstendamm.jpg',
    place:'Kurfürstendamm',
    line:'The clock tower kept its scars on purpose, standing over the shopping street anyway.',
    meta:'Charlottenburg',
    size:'sm', pin:'pin' },

  { src:'photos/berlin-cathedral.jpg',
    place:'Berliner Dom',
    line:'A dome heavy enough that it needed its own crane standing next to it.',
    meta:'Mitte',
    size:'sm', pin:'tape' },

  { src:'photos/berlin-wall.jpg',
    place:'East Side Gallery',
    line:'A wall that used to mean the opposite of what it means now.',
    meta:'Friedrichshain',
    size:'sm', pin:'pin' },

];
