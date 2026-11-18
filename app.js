const services = [
  { id:"signature", name:"Signature Cut", category:"haircuts", duration:45, price:65, description:"A tailored consultation, precision cut, wash, and finished styling." },
  { id:"fade", name:"Skin Fade", category:"haircuts", duration:50, price:70, description:"Seamless fade work with sharp detailing and a considered finish." },
  { id:"scissor", name:"Scissor & Style", category:"haircuts", duration:60, price:85, description:"A complete scissor-led cut for natural movement and texture." },
  { id:"beard", name:"Beard Sculpt", category:"beard", duration:30, price:40, description:"Shape, line, and balance the beard with hot towels and finish oil." },
  { id:"shave", name:"Traditional Shave", category:"beard", duration:45, price:55, description:"Hot towel preparation, straight razor shave, and cooling balm." },
  { id:"blade", name:"The Blade Experience", category:"packages", duration:90, price:115, description:"Signature cut, beard sculpt, hot towel treatment, and premium finish." }
];

const state = { step:1, services:new Set(), barber:"", date:"", time:"", confirmed:false };
const $ = (selector, scope=document) => scope.querySelector(selector);
const $$ = (selector, scope=document) => [...scope.querySelectorAll(selector)];

function formatDuration(minutes) { return minutes >= 60 ? `${Math.floor(minutes/60)} hr${minutes%60 ? ` ${minutes%60} min` : ""}` : `${minutes} min`; }

function renderServices(filter="all") {
  const grid = $("#serviceGrid");
  grid.innerHTML = services.map((service,index) => `
    <article class="service-card reveal visible" data-category="${service.category}">
      <div class="service-top"><span>0${index+1}</span><span>${formatDuration(service.duration)}</span></div>
      <div><h3>${service.name}</h3><p>${service.description}</p></div>
      <div class="service-bottom"><span class="service-price">$${service.price}</span><button class="add-service" data-service="${service.id}" aria-label="Book ${service.name}">+</button></div>
    </article>`).join("");

  $$(".service-card",grid).forEach(card => card.classList.toggle("hidden", filter !== "all" && card.dataset.category !== filter));
  $$(".add-service",grid).forEach(button => button.addEventListener("click", () => openBooking(button.dataset.service)));
}

function renderBookingServices() {
  $("#bookingServices").innerHTML = services.map(service => `
    <button class="booking-option" data-choice="service" data-value="${service.id}">
      <div><strong>${service.name}</strong><small>${formatDuration(service.duration)}</small></div><b>$${service.price}</b>
    </button>`).join("");
}

function openBooking(preselectedService, barber) {
  const backdrop = $("#bookingBackdrop");
  state.confirmed = false;
  if (preselectedService) state.services = new Set([preselectedService]);
  if (barber) state.barber = barber;
  goToStep(1);
  syncChoices();
  updateBookingSummary();
  backdrop.classList.add("open");
  backdrop.setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
}

function closeBooking() {
  const backdrop = $("#bookingBackdrop");
  backdrop.classList.remove("open");
  backdrop.setAttribute("aria-hidden","true");
  document.body.style.overflow="";
}

function syncChoices() {
  $$("[data-choice='service']").forEach(button => button.classList.toggle("selected", state.services.has(button.dataset.value)));
  $$("[data-choice='barber']").forEach(button => {
    const selected = state.barber === button.dataset.value;
    button.classList.toggle("selected", selected);
    $("i",button).textContent = selected ? "●" : "○";
  });
  $$(".date-option").forEach(button => button.classList.toggle("selected", state.date === button.dataset.value));
  $$(".time-option").forEach(button => button.classList.toggle("selected", state.time === button.dataset.value));
}

function updateBookingSummary() {
  const selected = services.filter(service => state.services.has(service.id));
  const minutes = selected.reduce((sum,service) => sum + service.duration,0);
  const price = selected.reduce((sum,service) => sum + service.price,0);
  $("#selectedSummary").text("Choose a service");
  $("#selectedSummary").textContent = selected.length ? selected.map(service => service.name).join(" + ") : "Choose a service";
  $("#bookingPrice").textContent = selected.length ? `$${price} · ${formatDuration(minutes)}` : "—";
  validateStep();
}

function validateStep() {
  const button = $("#nextStep");
  let valid = false;
  if (state.step === 1) valid = state.services.size > 0;
  if (state.step === 2) valid = !!state.barber;
  if (state.step === 3) valid = !!state.date && !!state.time;
  if (state.step === 4) valid = false;
  button.disabled = !valid;
  if (state.step === 4) button.textContent = "Confirm booking";
  else button.innerHTML = `Continue <span>→</span>`;
}

function goToStep(step) {
  state.step = step;
  $$(".booking-step").forEach(panel => panel.classList.toggle("active",Number(panel.dataset.step) === step));
  $("#stepLabel").textContent = `${step} / 4`;
  $("#progressBar").style.width = `${step*25}%`;
  $("#backStep").hidden = step === 1;
  $("#nextStep").hidden = state.confirmed;
  validateStep();
}

function renderDates() {
  const container = $("#dateOptions");
  const today = new Date();
  container.innerHTML = "";
  for(let i=1;i<=5;i++) {
    const date = new Date(today); date.setDate(today.getDate()+i);
    if(date.getDay() === 0 && i < 5) continue;
    const value = date.toISOString().split("T")[0];
    const button = document.createElement("button");
    button.className="date-option"; button.dataset.choice="date"; button.dataset.value=value;
    button.innerHTML=`<small>${date.toLocaleDateString("en-US",{weekday:"short"})}</small><strong>${date.toLocaleDateString("en-US",{month:"short",day:"numeric"})}</strong>`;
    container.appendChild(button);
  }
}

function renderTimes() {
  const times=["9:00 AM","9:45 AM","10:30 AM","11:15 AM","12:30 PM","1:15 PM","2:00 PM","3:30 PM","4:15 PM","5:00 PM","6:30 PM","7:15 PM"];
  $("#timeOptions").innerHTML=times.map(time=>`<button class="time-option" data-choice="time" data-value="${time}">${time}</button>`).join("");
}

function confirmBooking() {
  const form = $("#clientForm");
  if(!form.checkValidity()) { form.reportValidity(); return; }
  const data = new FormData(form);
  const selected = services.filter(service => state.services.has(service.id));
  const date = new Date(state.date+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  state.confirmed=true;
  form.hidden=true;
  $("#confirmationCard").hidden=false;
  $("#confirmationSummary").textContent=`${selected.map(s=>s.name).join(" + ")} · ${date} at ${state.time} · ${state.barber || "First Available"}`;
  $("#nextStep").hidden=true;
  $("#bookingTitle").textContent=`Confirmed, ${data.get("name")?.split(" ")[0] || "friend"}`;
}

function addToCalendar() {
  const selected = services.filter(service=>state.services.has(service.id));
  const start = new Date(`${state.date}T${convertTime(state.time)}:00`);
  const duration = selected.reduce((sum,s)=>sum+ s.duration,0);
  const end = new Date(start.getTime()+duration*60000);
  const stamp = date => date.toISOString().replace(/[-:]|\.\d{3}/g,"");
  const text = encodeURIComponent(`ATELIER BLADE: ${selected.map(s=>s.name).join(" + ")}`);
  const details = encodeURIComponent(`Barber: ${state.barber}\nATELIER BLADE, 128 Mercer Street, New York`);
  const url=`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${stamp(start)}/${stamp(end)}&details=${details}&location=${encodeURIComponent("128 Mercer Street, New York")}`;
  window.open(url,"_blank","noopener");
}

function convertTime(time) {
  const [clock,period]=time.split(" "); let [hours,minutes]=clock.split(":").map(Number);
  if(period==="PM"&&hours!==12) hours+=12;
  if(period==="AM"&&hours===12) hours=0;
  return `${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}`;
}

function updateOpenStatus() {
  const now=new Date(); const day=now.getDay(); const hour=now.getHours()+now.getMinutes()/60;
  const open=day>=1&&day<=5 ? hour>=9&&hour<20 : hour>=9&&hour<18;
  const badge=$("#openStatus"); badge.innerHTML=`<span></span>${open?"Open now":"Closed"}`; badge.classList.toggle("closed",!open);
}

$$("[data-open-booking]").forEach(button => button.addEventListener("click",()=>openBooking(null,button.dataset.barber || "")));
$("#closeBooking").addEventListener("click",closeBooking);
$("#bookingBackdrop").addEventListener("click",event=>{ if(event.target.id==="bookingBackdrop") closeBooking(); });
document.addEventListener("keydown",event=>{ if(event.key==="Escape") closeBooking(); });

renderServices(); renderBookingServices(); renderDates(); renderTimes(); updateOpenStatus();
$("#year").textContent=new Date().getFullYear();

$$('.segment').forEach(button=>button.addEventListener("click",()=>{
  $$('.segment').forEach(item=>{item.classList.remove("active");item.setAttribute("aria-selected","false")});
  button.classList.add("active");button.setAttribute("aria-selected","true");renderServices(button.dataset.filter);
}));

document.addEventListener("click",event=>{
  const choice=event.target.closest("[data-choice]");
  if(!choice) return;
  const {choice:kind,value}=choice.dataset;
  if(kind==="service") state.services.has(value)?state.services.delete(value):state.services.add(value);
  if(kind==="barber") state.barber=value;
  if(kind==="date") {state.date=value;state.time=""}
  if(kind==="time") state.time=value;
  syncChoices(); updateBookingSummary();
});

$("#nextStep").addEventListener("click",()=>{ if(state.step===4) confirmBooking(); else goToStep(state.step+1); });
$("#backStep").addEventListener("click",()=>goToStep(state.step-1));
$("#addCalendar").addEvent("click",addToCalendar);

const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target)}}),{threshold:.12});
$$('.reveal').forEach(element=>observer.observe(element));

window.addEventListener("scroll",()=>{
  const visual=$(".hero-visual");
  if(!visual) return;
  const image=$("img",visual); const offset=Math.min(window.scrollY*.08,35);
  image.style.transform=`scale(1.03) translateY(${offset*.12}px)`;
},{passive:true});
