/** Evidence-backed, conservative rule engine. No legal AI or filings. */
export const cantons = {
  ZH: {name: 'Zürich', locale:'de', url:'https://www.zh.ch/de/wirtschaft-arbeit/handelsregister/aktiengesellschaft/mitglieder-eintragen-aendern-loeschen.html',
    signatory:'https://www.zh.ch/de/wirtschaft-arbeit/handelsregister/aktiengesellschaft/personalmutation-zeichnungsberechtigte.html',
    gmbh:'https://www.zh.ch/de/wirtschaft-arbeit/handelsregister/gmbh/geschaeftsfuehrer-eintragen-aendern-loeschen.html',
    note:'The cantonal portal distinguishes board appointments, managing directors and authorized signatories; use the specific checklist on the official page.'},
  VD: {name:'Vaud',locale:'fr',url:'https://www.vd.ch/prestation/modifier-linscription-dune-societe-anonyme-au-registre-du-commerce',
    note:'The commercial register does not accept modification applications by ordinary email. Check the signed requisition and supporting originals.'},
  GE: {name:'Genève',locale:'fr',url:'https://www.ge.ch/inscrire-au-registre-du-commerce-actualiser-ses-donnees/modifier-son-inscription',
    note:'The register provides requisition templates and describes who can sign a modification request. Verify the company form and signatory authority.'},
  BS: {name:'Basel-Stadt',locale:'de',url:'https://www.bs.ch/jsd/zentraler-rechtsdienst/handelsregisteramt',
    memo:'https://media.bs.ch/original_file/cf6cca8aab1c6b9c4f394ddd251e7397f95e562d/2026merkblatt-belege-personalmutationen-0.pdf',
    note:'Consult the Basel-Stadt guide for changes to persons. Paper submissions and qualified digital submissions have different requirements.'}
};
export const federalSources = [
  {name:'Swiss Code of Obligations (CO/OR), SR 220',url:'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/en'},
  {name:'Commercial Register Ordinance (HRegV/ORC), SR 221.411',url:'https://www.fedlex.admin.ch/eli/cc/2007/664/en'}
];
export const companyTypes=['AG','GmbH'];
export const changeTypes=['appoint','remove','signature'];
export const genericDocuments = {
  appoint: [
    {id:'application',text:'Prepare the signed commercial-register amendment application.'},
    {id:'resolution',text:'Confirm the competent corporate body and prepare the relevant resolution or minutes.'},
    {id:'acceptance',text:'Obtain acceptance of appointment where required.'},
    {id:'identification',text:'Check identity documentation for newly registered persons.'},
    {id:'signature',text:'Check the need for a certified signature specimen where signing authority is registered.'},
  ],
  remove: [
    {id:'application',text:'Prepare the signed commercial-register amendment application.'},
    {id:'departure',text:'Collect the resignation or dismissal record, as applicable.'},
    {id:'resolution',text:'Check which corporate resolution or minutes support this change.'},
    {id:'representation',text:'Verify that remaining representation requirements are met after removal.'},
  ],
  signature: [
    {id:'application',text:'Prepare the signed commercial-register amendment application.'},
    {id:'authority',text:'Record the competent body’s decision on signing authority.'},
    {id:'identification',text:'If a new person is registered, check identity documentation.'},
    {id:'signature',text:'For newly registered signatories, check certified signature requirements.'},
  ]
};
export function evaluate(input) {
  const canton=cantons[input.canton];
  if (!canton || !companyTypes.includes(input.companyType) || !changeTypes.includes(input.changeType)) throw new Error('Unsupported configuration');
  const missing=[];
  if(!input.companyName?.trim()) missing.push('Company name');
  if(!input.personName?.trim()) missing.push('Person concerned');
  if(!input.competentBodyConfirmed) missing.push('Competent body / articles of association not yet confirmed');
  if(input.changeType==='signature' && !input.signingAuthority?.trim()) missing.push('Signature arrangement (individual / collective)');
  const docs=genericDocuments[input.changeType].map(x=>({...x,checked:false}));
  if(input.companyType==='GmbH') {
    const item=docs.find(x=>x.id==='resolution');
    if(item) item.text='Check the articles of association and the responsible shareholders’ meeting or managing body; prepare the corresponding minutes.';
  }
  const flags=[
    'Human review required: this is a draft checklist, not a registration or an approval.',
    'Confirm representation by a Swiss-resident authorized person after any change.',
    'Confirm the company’s current commercial-register extract and articles of association.',
    ...(input.companyType==='GmbH'?['GmbH managing directors are not necessarily appointed under the same procedure as AG board members.']:[]),
    ...(missing.length?['Some required facts are missing; do not treat the checklist as ready to file.']:[])
  ];
  return {companyType:input.companyType, canton:input.canton, changeType:input.changeType, companyName:input.companyName||'',personName:input.personName||'', generatedAt:new Date().toISOString(), documents:docs, missing, flags, federalSources, cantonalSource: {name:`Commercial Register — ${canton.name}`,url:input.canton==='ZH' && input.companyType==='GmbH'?canton.gmbh:input.canton==='ZH' && input.changeType==='signature'?canton.signatory:canton.url}, cantonNote:canton.note, status:'DRAFT — NOT VALIDATED'};
}
