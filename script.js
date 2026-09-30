const typeColor = {
  bug:"#26de81", dragon:"#b78cff", electric:"#fed330", fairy:"#ff4fb4",
  fighting:"#5558a8", fire:"#f0932b", flying:"#72dff0", grass:"#00b894",
  ground:"#d8a743", ghost:"#a55eea", ice:"#74b9ff", normal:"#95afc0",
  poison:"#8065e8", psychic:"#c06df2", rock:"#7c6a58", water:"#0190ff"
};

const pokemonUrl = "https://pokeapi.co/api/v2/pokemon/";
const typeUrl = "https://pokeapi.co/api/v2/type/";

const pages = {};
["home","pokemon","type","mystery","battle","collection","info","settings"].forEach(name=>{
  pages[name] = document.getElementById(name+"Page");
});

const menuItems = [...document.querySelectorAll(".menu-item")];
const globalSearch = document.getElementById("globalSearch");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const pokemonSearchResult = document.getElementById("pokemonSearchResult");
const typeButtons = document.getElementById("typeButtons");
const typeCards = document.getElementById("typeCards");
const selectedType = document.getElementById("selectedType");

function showPage(name){
  Object.values(pages).forEach(p=>p.classList.remove("active"));
  pages[name]?.classList.add("active");
  menuItems.forEach(btn=>btn.classList.toggle("active", btn.dataset.page===name));
  window.scrollTo({top:0,behavior:"smooth"});
}

document.addEventListener("click", e=>{
  const go = e.target.closest("[data-go]");
  if(go) showPage(go.dataset.go);
});

menuItems.forEach(btn=>btn.addEventListener("click",()=>showPage(btn.dataset.page)));

async function getPokemon(value){
  const response = await fetch(pokemonUrl + encodeURIComponent(String(value).trim().toLowerCase()));
  if(!response.ok) throw new Error("Pokémon not found");
  return response.json();
}

function officialImage(p){
  return p.sprites?.other?.["official-artwork"]?.front_default ||
         p.sprites?.other?.dream_world?.front_default ||
         p.sprites?.front_default || "";
}

function typePills(p){
  return p.types.map(t=>`<span style="background:${typeColor[t.type.name]||"#777"}">${t.type.name}</span>`).join("");
}

function statValue(p,index){ return p.stats?.[index]?.base_stat ?? 0; }

function baseCard(p, compact=false){
  const type = p.types[0].type.name;
  const color = typeColor[type] || "#95afc0";
  return `<article class="pokemon-card ${compact?"compact":""}" style="--card-color:${color}">
    <div class="card-top"><span>#${String(p.id).padStart(3,"0")}</span><b>HP ${statValue(p,0)}</b></div>
    <div class="card-image"><img src="${officialImage(p)}" alt="${p.name}"></div>
    <h3>${cap(p.name)}</h3>
    <div class="card-types">${typePills(p)}</div>
    <div class="card-stats">
      <div><b>${statValue(p,1)}</b><small>Attack</small></div>
      <div><b>${statValue(p,2)}</b><small>Defense</small></div>
      <div><b>${statValue(p,5)}</b><small>Speed</small></div>
    </div>
    <button class="view-detail" data-detail="${p.name}">View Details</button>
  </article>`;
}

function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}

async function searchPokemon(){
  const value = searchInput.value.trim();
  if(!value){
    pokemonSearchResult.innerHTML = `<div class="error-panel"><h2>Search for a Pokémon</h2><p>Try Pikachu, Charizard or a Pokédex number.</p></div>`;
    return;
  }
  pokemonSearchResult.innerHTML = `<div class="loading-panel">Searching for <b>${value}</b>...</div>`;
  try{
    const p = await getPokemon(value);
    pokemonSearchResult.innerHTML = `
      <div class="search-result-card">
        <div class="result-art"><div class="art-glow"></div><img src="${officialImage(p)}" alt="${p.name}"></div>
        <div class="result-summary">
          <p class="eyebrow">POKÉDEX #${String(p.id).padStart(3,"0")}</p>
          <h2>${cap(p.name)}</h2>
          <div class="result-types">${typePills(p)}</div>
          <p class="flavor">${flavorText(p)}</p>
          <div class="detail-stats">
            <div><span>HP</span><b>${statValue(p,0)}</b></div>
            <div><span>Attack</span><b>${statValue(p,1)}</b></div>
            <div><span>Defense</span><b>${statValue(p,2)}</b></div>
            <div><span>Speed</span><b>${statValue(p,5)}</b></div>
          </div>
          <div class="search-result-actions">
            <button class="gradient-btn" data-detail="${p.name}">Open Full Details</button>
            <button class="collection-inline-add ${isCollected(p.id)?"added":""}" data-add-collection="${p.id}">${isCollected(p.id)?"✓ In Collection":"＋ Add to Collection"}</button>
          </div>
        </div>
        <div class="result-extra">
          <h3>Moves</h3>
          <div class="moves-list">${p.moves.slice(0,4).map((m,i)=>`<div><i class="move-dot">${["🔥","◎","✦","◆"][i]}</i><span>${prettyMove(m.move.name)}</span></div>`).join("")}</div>
          <h3>Profile</h3>
          <div class="profile-grid"><div><span>Height</span><b>${(p.height/10).toFixed(1)} m</b></div><div><span>Weight</span><b>${(p.weight/10).toFixed(1)} kg</b></div></div>
        </div>
      </div>`;
  }catch{
    pokemonSearchResult.innerHTML = `<div class="error-panel"><h2>Pokémon not found 😢</h2><p>Please enter a valid Pokémon name or Pokédex ID.</p></div>`;
  }
}

function flavorText(p){
  const type = cap(p.types[0].type.name);
  return `${cap(p.name)} is a ${type}-type Pokémon. Explore its stats, moves, profile and evolution chain in the full details view.`;
}
function prettyMove(s){return s.split("-").map(cap).join(" ");}

searchBtn.addEventListener("click",searchPokemon);
searchInput.addEventListener("keydown",e=>{if(e.key==="Enter")searchPokemon();});
document.querySelectorAll(".inline-search").forEach(b=>b.addEventListener("click",()=>{
  showPage("pokemon"); searchInput.value=b.dataset.search; searchPokemon();
}));
globalSearch.addEventListener("keydown",e=>{
  if(e.key==="Enter" && globalSearch.value.trim()){
    showPage("pokemon"); searchInput.value=globalSearch.value.trim(); globalSearch.value=""; searchPokemon();
  }
});

const allTypes = ["bug","dark","dragon","electric","fairy","fighting","fire","flying","ghost","grass","ground","ice","normal","poison","psychic","rock","steel","water"];

allTypes.forEach(type=>{
  const b=document.createElement("button");
  b.className="type-chip";
  b.dataset.type=type;
  b.innerHTML=`<span style="background:${typeColor[type]||"#64748b"}"></span>${cap(type)}`;
  b.addEventListener("click",()=>searchByType(type));
  typeButtons.appendChild(b);
});

async function searchByType(type){
  document.querySelectorAll(".type-chip").forEach(b=>b.classList.toggle("active",b.dataset.type===type));
  selectedType.textContent=`Loading all ${cap(type)} Pokémon...`;
  typeCards.innerHTML=`<div class="loading-panel">Loading every Pokémon in this type...</div>`;
  try{
    const res=await fetch(typeUrl+type);
    if(!res.ok)throw new Error();
    const data=await res.json();
    selectedType.textContent=`${data.pokemon.length} ${cap(type)} Pokémon`;
    typeCards.innerHTML="";
    const items=data.pokemon;
    // Fetch in small batches so the page can display the entire type without overwhelming the API.
    for(let start=0; start<items.length; start+=20){
      const batch=await Promise.all(items.slice(start,start+20).map(x=>fetch(x.pokemon.url).then(r=>r.json())));
      typeCards.insertAdjacentHTML("beforeend",batch.map(p=>baseCard(p)).join(""));
      if(start===0) typeCards.scrollIntoView({behavior:"smooth",block:"start"});
    }
  }catch{
    selectedType.textContent="Could not load this type";
    typeCards.innerHTML=`<div class="error-panel"><h2>Type unavailable</h2><p>Please try another Pokémon type.</p></div>`;
  }
}

// ==========================================
// POKÉMON INFO / EVOLUTION FAMILY
// ==========================================
const infoSearchInput = document.getElementById("infoSearchInput");
const infoSearchBtn = document.getElementById("infoSearchBtn");
const infoResult = document.getElementById("infoResult");
const speciesUrl = "https://pokeapi.co/api/v2/pokemon-species/";
const evolutionCache = new Map();

async function getSpecies(value){
  const key=String(value).trim().toLowerCase();
  const response=await fetch(speciesUrl+encodeURIComponent(key));
  if(!response.ok) throw new Error("Species not found");
  return response.json();
}

async function getEvolutionFamily(pokemon){
  const species=await getSpecies(pokemon.id);
  const chainUrl=species.evolution_chain?.url;
  if(!chainUrl) return [{name:species.name,speciesId:species.id}];
  if(evolutionCache.has(chainUrl)) return evolutionCache.get(chainUrl);
  const response=await fetch(chainUrl);
  if(!response.ok) throw new Error("Evolution chain not found");
  const data=await response.json();
  const stages=[];
  function walk(node, depth=0){
    if(!stages[depth]) stages[depth]=[];
    const speciesId=Number(node.species.url.split("/").filter(Boolean).pop());
    stages[depth].push({name:node.species.name,speciesId});
    node.evolves_to.forEach(child=>walk(child,depth+1));
  }
  walk(data.chain);
  const flat=stages.flat();
  evolutionCache.set(chainUrl,flat);
  return flat;
}

async function searchInfo(){
  const value=infoSearchInput?.value.trim();
  if(!value) return;
  infoResult.innerHTML=`<div class="loading-panel">Loading the evolution family for <b>${value}</b>...</div>`;
  try{
    const pokemon=await getPokemon(value);
    const family=await getEvolutionFamily(pokemon);
    const unique=[];
    const seen=new Set();
    family.forEach(x=>{if(!seen.has(x.speciesId)){seen.add(x.speciesId);unique.push(x);}});
    const details=await Promise.all(unique.map(x=>getPokemon(x.speciesId)));
    const detailMap=new Map(details.map(p=>[p.id,p]));
    const stages=[];
    unique.forEach(x=>{
      const p=detailMap.get(x.speciesId);
      const speciesStage=family.indexOf(x);
      // The stage grouping is reconstructed from the evolution chain order below.
      if(!stages[speciesStage]) stages[speciesStage]=[];
      stages[speciesStage].push(p);
    });
    // Rebuild exact levels from the chain recursively so branching families remain grouped.
    const species=await getSpecies(pokemon.id);
    const chainResponse=await fetch(species.evolution_chain.url);
    const chainData=await chainResponse.json();
    const levels=[];
    function group(node,depth=0){
      if(!levels[depth]) levels[depth]=[];
      const id=Number(node.species.url.split("/").filter(Boolean).pop());
      const p=detailMap.get(id);
      if(p) levels[depth].push(p);
      node.evolves_to.forEach(child=>group(child,depth+1));
    }
    group(chainData.chain);

    const searchedLevel=levels.findIndex(level=>level.some(p=>p.id===pokemon.id));
    const familyCount=unique.length;
    infoResult.innerHTML=`
      <div class="info-family-header">
        <div>
          <p class="eyebrow">EVOLUTION FAMILY</p>
          <h2>${cap(pokemon.name)}</h2>
          <p>${familyCount} Pokémon in this evolution family${searchedLevel>=0?` · You searched stage ${searchedLevel+1}`:""}.</p>
        </div>
        <button class="ghost-btn" data-detail="${pokemon.name}">View Pokémon Details</button>
      </div>
      <div class="evolution-family">
        ${levels.map((level,index)=>`
          <div class="evolution-stage">
            <div class="stage-label">STAGE ${index+1}</div>
            <div class="evolution-stage-cards">
              ${level.map(p=>{
                const active=p.id===pokemon.id;
                return `<article class="evolution-card ${active?"searched":""}">
                  ${active?'<span class="searched-badge">YOU SEARCHED</span>':''}
                  <div class="evolution-art"><img src="${officialImage(p)}" alt="${p.name}"></div>
                  <h3>${cap(p.name)}</h3>
                  <small>#${String(p.id).padStart(3,"0")}</small>
                  <div class="result-types evolution-types">${typePills(p)}</div>
                  <div class="evolution-mini-stats"><span>HP <b>${statValue(p,0)}</b></span><span>ATK <b>${statValue(p,1)}</b></span><span>SPD <b>${statValue(p,5)}</b></span></div>
                  <button class="view-detail" data-detail="${p.name}">View Details</button>
                </article>`;
              }).join("")}
            </div>
          </div>
          ${index<levels.length-1?'<div class="evolution-arrow">↓</div>':''}
        `).join("")}
      </div>`;
  }catch(error){
    console.error(error);
    infoResult.innerHTML=`<div class="error-panel"><h2>Pokémon not found 😢</h2><p>Enter a valid Pokémon name or Pokédex number and try again.</p></div>`;
  }
}

infoSearchBtn?.addEventListener("click",searchInfo);
infoSearchInput?.addEventListener("keydown",e=>{if(e.key==="Enter")searchInfo();});
document.querySelectorAll(".info-example").forEach(b=>b.addEventListener("click",()=>{
  showPage("info");
  infoSearchInput.value=b.dataset.search;
  searchInfo();
}));

// DETAIL MODAL
const overlay=document.getElementById("detailOverlay");
const detailClose=document.getElementById("detailClose");
document.addEventListener("click",async e=>{
  const target=e.target.closest("[data-detail]");
  if(!target)return;
  openDetail(target.dataset.detail);
});
detailClose.addEventListener("click",()=>overlay.classList.remove("open"));
overlay.addEventListener("click",e=>{if(e.target===overlay)overlay.classList.remove("open");});

async function openDetail(name){
  overlay.classList.add("open");
  document.getElementById("detailCardArt").innerHTML=`<div class="detail-loading">Loading...</div>`;
  document.getElementById("detailMain").innerHTML="";
  document.getElementById("detailSide").innerHTML="";
  try{
    const p=await getPokemon(name);
    const main=p.types[0].type.name;
    const rarity=getRarity(p.id);
    document.getElementById("detailCardArt").innerHTML=`
      <div class="collect-card ${rarity.class}" style="--card-color:${typeColor[main]||"#74b9ff"}">
        <div class="collect-rarity">${rarity.label}</div>
        <img src="${officialImage(p)}" alt="${p.name}">
        <h2>${cap(p.name)}</h2>
        <small>Lv. ${Math.max(5,Math.floor(p.base_experience/5))}</small>
        <div>${typePills(p)}</div>
      </div>`;
    document.getElementById("detailMain").innerHTML=`
      <div class="detail-heading"><h2>${cap(p.name)}</h2><span class="rarity-badge ${rarity.class}">${rarity.label}</span></div>
      <h4>Type</h4><div class="result-types">${typePills(p)}</div>
      <div class="bio-grid"><div><span>Height</span><b>${(p.height/10).toFixed(1)} m</b></div><div><span>Weight</span><b>${(p.weight/10).toFixed(1)} kg</b></div></div>
      <p class="detail-description">${flavorText(p)}</p>
      <h4>Stats</h4>
      <div class="bar-list">
        ${bar("HP",statValue(p,0),255)}${bar("Attack",statValue(p,1),255)}${bar("Defense",statValue(p,2),255)}${bar("Speed",statValue(p,5),255)}
      </div>`;
    document.getElementById("detailSide").innerHTML=`
      <h3>Moves</h3>
      <div class="moves-list">${p.moves.slice(0,4).map((m,i)=>`<div><i class="move-dot">${["🔥","◎","✦","◆"][i]}</i><span>${prettyMove(m.move.name)}</span></div>`).join("")}</div>
      <h3>Evolution Chain</h3>
      <div class="evolution-chain"><div><img src="${officialImage(p)}"><small>${cap(p.name)}</small></div></div>
      <button class="gradient-btn wide">＋ Add to Collection</button>`;
  }catch{
    document.getElementById("detailCardArt").innerHTML=`<div class="detail-loading">Could not load card.</div>`;
  }
}
function bar(label,value,max){return `<div class="stat-bar"><span>${label}</span><div><i style="width:${Math.min(100,value/max*100)}%"></i></div><b>${value}</b></div>`;}
function getRarity(id){
  if(id===6||id===9||id===3||id===150||id===151)return {label:"LEGENDARY",class:"legendary"};
  if(id%11===0)return {label:"EPIC",class:"epic"};
  if(id%5===0)return {label:"RARE",class:"rare"};
  if(id%2===0)return {label:"UNCOMMON",class:"uncommon"};
  return {label:"COMMON",class:"common"};
}

// MYSTERY
const mysteryCard=document.getElementById("mysteryCard");
const mysteryFront=document.getElementById("mysteryFront");
const mysteryBtn=document.getElementById("mysteryBtn");
const mysteryHistory=document.getElementById("mysteryHistory");
let mysteryRevealed=false, mysteryHistoryData=[];

async function drawMystery(){
  mysteryBtn.disabled=true;mysteryBtn.textContent="Opening...";
  mysteryCard.classList.remove("revealed");
  const id=Math.floor(Math.random()*151)+1;
  try{
    const p=await getPokemon(id);
    const rarity=getRarity(p.id);
    const color=typeColor[p.types[0].type.name]||"#2788ff";
    mysteryFront.innerHTML=`
      <div class="mystery-card-inner ${rarity.class}">
        <span class="collect-rarity">${rarity.label}</span>
        <img src="${officialImage(p)}" alt="${p.name}">
        <h2>${cap(p.name)}</h2>
        <div class="mystery-front-types">${typePills(p)}</div>
        <small>HP ${statValue(p,0)} · ATK ${statValue(p,1)} · DEF ${statValue(p,2)}</small>
      </div>`;
    mysteryFront.style.setProperty("--mystery-color",color);
    mysteryCard.classList.add("revealed");
    mysteryRevealed=true;
    mysteryBtn.textContent="Draw Another Card";
    mysteryHistoryData.unshift({name:p.name,img:officialImage(p),rarity:rarity.label});
    mysteryHistoryData=mysteryHistoryData.slice(0,5);
    mysteryHistory.innerHTML=mysteryHistoryData.map(x=>`<div class="history-item"><img src="${x.img}"><div><b>${cap(x.name)}</b><small>${x.rarity}</small></div></div>`).join("");
  }catch{mysteryBtn.textContent="Try Again";}
  mysteryBtn.disabled=false;
}
mysteryBtn.addEventListener("click",drawMystery);
mysteryCard.addEventListener("click",()=>{if(!mysteryRevealed)drawMystery();});

// BATTLE
const battleOne=document.getElementById("battleOne"), battleTwo=document.getElementById("battleTwo");
const battleBtn=document.getElementById("battleBtn"), battleResult=document.getElementById("battleResult");

async function battle(){
  const a=battleOne.value.trim(), b=battleTwo.value.trim();
  if(!a||!b){battleResult.innerHTML=`<div class="battle-empty">Enter both Pokémon above to preview the battle.</div>`;return;}
  battleResult.innerHTML=`<div class="loading-panel">Preparing battle...</div>`;
  try{
    const [p1,p2]=await Promise.all([getPokemon(a),getPokemon(b)]);
    battleResult.innerHTML=`
      ${battleCard(p1,"YOUR POKÉMON","blue")}
      <div class="versus">VS<div>⚡</div></div>
      ${battleCard(p2,"OPPONENT","red")}`;
  }catch{battleResult.innerHTML=`<div class="error-panel"><h2>Battle Pokémon not found</h2><p>Check both names and try again.</p></div>`;}
}
function battleCard(p,label,side){
  return `<article class="battle-card ${side}">
    <h2>${label}</h2>
    <div class="battle-art"><img src="${officialImage(p)}"></div>
    <h3>${cap(p.name)}</h3>
    <small>Lv. ${Math.max(5,Math.floor(p.base_experience/5))}</small>
    <div class="battle-type">${typePills(p)}</div>
    <div class="hp-line"><span>HP</span><b>${statValue(p,0)} / ${statValue(p,0)}</b><div><i style="width:100%"></i></div></div>
    <div class="battle-stats-list">
      <div><span>✦ Attack</span><b>${statValue(p,1)}</b></div>
      <div><span>◇ Defense</span><b>${statValue(p,2)}</b></div>
      <div><span>✧ Speed</span><b>${statValue(p,5)}</b></div>
    </div>
  </article>`;
}
battleBtn.addEventListener("click",battle);
[battleOne,battleTwo].forEach(i=>i.addEventListener("keydown",e=>{if(e.key==="Enter")battle();}));

// HOME RECENT
async function loadRecent(){
  const root=document.getElementById("recentCards");
  try{
    const list=await Promise.all(["pikachu","gyarados","charizard"].map(getPokemon));
    root.innerHTML=list.map(p=>`<button class="recent-card" data-recent="${p.name}"><img src="${officialImage(p)}"><div><b>${cap(p.name)}</b><small>${cap(p.types[0].type.name)}</small></div></button>`).join("");
    root.querySelectorAll("[data-recent]").forEach(b=>b.addEventListener("click",()=>{showPage("pokemon");searchInput.value=b.dataset.recent;searchPokemon();}));
  }catch{}
}
loadRecent();

// ==========================================
// MY COLLECTION
// ==========================================
const COLLECTION_KEY = "pokemonCardLabCollection";
const collectionSearchInput = document.getElementById("collectionSearchInput");
const collectionSearchBtn = document.getElementById("collectionSearchBtn");
const collectionSearchResult = document.getElementById("collectionSearchResult");
const collectionCards = document.getElementById("collectionCards");
const collectionCount = document.getElementById("collectionCount");
const collectionSubtitle = document.getElementById("collectionSubtitle");
const clearCollectionBtn = document.getElementById("clearCollectionBtn");

function getCollection(){
  try { return JSON.parse(localStorage.getItem(COLLECTION_KEY) || "[]"); }
  catch { return []; }
}
function saveCollection(list){ localStorage.setItem(COLLECTION_KEY, JSON.stringify(list)); }
function isCollected(id){ return getCollection().some(x=>Number(x.id)===Number(id)); }

function updateCollectionCount(){
  const count=getCollection().length;
  if(collectionCount) collectionCount.textContent=`${count} / 151 Collected`;
  if(collectionSubtitle) collectionSubtitle.textContent=count ? `${count} Pokémon saved in your collection.` : "Your saved Pokémon will appear here.";
}

function addToCollection(p){
  const list=getCollection();
  if(list.some(x=>Number(x.id)===Number(p.id))) return false;
  list.push({id:p.id,name:p.name});
  saveCollection(list);
  updateCollectionCount();
  renderCollection();
  return true;
}

function removeFromCollection(id){
  saveCollection(getCollection().filter(x=>Number(x.id)!==Number(id)));
  updateCollectionCount();
  renderCollection();
}

function renderCollection(){
  if(!collectionCards) return;
  const list=getCollection();
  updateCollectionCount();
  if(!list.length){
    collectionCards.innerHTML=`<div class="collection-empty">
      <div class="empty-pokeball">◉</div>
      <h3>Your collection is empty</h3>
      <p>Search for a Pokémon above and use “Add to Collection” to save it here.</p>
      <button class="gradient-btn" data-go="pokemon">Search Pokémon</button>
    </div>`;
    return;
  }
  collectionCards.innerHTML=list.map(item=>`<div class="collection-card" data-collection-id="${item.id}">
    <div class="collection-card-top"><span>#${String(item.id).padStart(3,"0")}</span><span>COLLECTED</span></div>
    <div class="collection-card-img"><img src="" alt="${item.name}" data-collection-img="${item.id}"></div>
    <h3>${cap(item.name)}</h3>
    <div class="collection-card-types" data-collection-types="${item.id}"><span>Loading</span></div>
    <div class="collection-card-bottom"><span>Pokémon #${item.id}</span><button class="collection-remove" data-remove-collection="${item.id}">Remove</button></div>
  </div>`).join("");

  list.forEach(async item=>{
    try{
      const p=await getPokemon(item.id);
      const img=document.querySelector(`[data-collection-img="${item.id}"]`);
      const types=document.querySelector(`[data-collection-types="${item.id}"]`);
      if(img) img.src=officialImage(p);
      if(types) types.innerHTML=p.types.map(t=>`<span style="background:${typeColor[t.type.name]||"#777"}">${t.type.name}</span>`).join("");
    }catch{}
  });
}

async function searchForCollection(){
  const value=collectionSearchInput?.value.trim();
  if(!value) return;
  collectionSearchResult.innerHTML=`<div class="loading-panel">Searching for <b>${value}</b>...</div>`;
  try{
    const p=await getPokemon(value);
    const added=isCollected(p.id);
    collectionSearchResult.innerHTML=`<div class="collection-result">
      <img src="${officialImage(p)}" alt="${p.name}">
      <div class="collection-result-info">
        <h3>${cap(p.name)}</h3>
        <p>Pokédex #${p.id} · HP ${statValue(p,0)} · Attack ${statValue(p,1)}</p>
        <div class="collection-result-types">${typePills(p)}</div>
      </div>
      <div class="collection-result-actions">
        <button class="add-collection-btn ${added?"added":""}" data-add-collection="${p.id}">${added?"✓ In Collection":"＋ Add to Collection"}</button>
        <button class="remove-collection-btn" data-detail="${p.name}">View Details</button>
      </div>
    </div>`;
  }catch{
    collectionSearchResult.innerHTML=`<div class="error-panel"><h2>Pokémon not found 😢</h2><p>Try a valid Pokémon name or Pokédex number.</p></div>`;
  }
}

collectionSearchBtn?.addEventListener("click",searchForCollection);
collectionSearchInput?.addEventListener("keydown",e=>{if(e.key==="Enter")searchForCollection();});
clearCollectionBtn?.addEventListener("click",()=>{
  if(!getCollection().length) return;
  if(confirm("Remove all Pokémon from your collection?")){
    saveCollection([]);
    renderCollection();
    if(collectionSearchResult) collectionSearchResult.innerHTML="";
  }
});

document.addEventListener("click",async e=>{
  const add=e.target.closest("[data-add-collection]");
  if(add){
    const id=add.dataset.addCollection;
    try{
      const p=await getPokemon(id);
      const wasAdded=addToCollection(p);
      add.textContent=wasAdded?"✓ In Collection":"✓ In Collection";
      add.classList.add("added");
    }catch{}
    return;
  }
  const remove=e.target.closest("[data-remove-collection]");
  if(remove){ removeFromCollection(remove.dataset.removeCollection); return; }
});

// Add the same collection action to the full Pokémon detail modal.
const originalOpenDetail=openDetail;
openDetail=async function(name){
  await originalOpenDetail(name);
  const side=document.getElementById("detailSide");
  if(!side) return;
  try{
    const p=await getPokemon(name);
    const added=isCollected(p.id);
    const old=side.querySelector(".detail-collection-action");
    if(old) old.remove();
    const btn=document.createElement("button");
    btn.className=`gradient-btn wide detail-collection-action ${added?"added":""}`;
    btn.dataset.addCollection=p.id;
    btn.textContent=added?"✓ In Collection":"＋ Add to Collection";
    side.appendChild(btn);
  }catch{}
};

renderCollection();

function updateHomeProgress(){
  const count=getCollection().length;
  const ring=document.querySelector(".progress-panel .ring");
  const percent=Math.round((count/151)*100);
  if(ring){ ring.style.background=`conic-gradient(#2788ff 0 ${percent}%,#102a4e ${percent}% 100%)`; ring.querySelector("span").textContent=`${percent}%`; }
  const strong=document.querySelector(".progress-panel .progress-row strong");
  if(strong) strong.textContent=`${count} / 151`;
  const small=document.querySelector(".progress-panel .progress-row small");
  if(small) small.textContent="Pokémon Collected";
}
const _oldRenderCollection=renderCollection;
renderCollection=function(){ _oldRenderCollection(); updateHomeProgress(); };
renderCollection();
