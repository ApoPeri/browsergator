// satellite-tree.js - renders hierarchical tree of scenario objects (Satellites, Ground Stations, Sensors)


import { assignSatellite, unassignSatellite, updateConstellationColor } from './constellations.js';

export function initTree(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // --- Selection & filter state ---
    let filterText = ''; // lowercase search string
    let selectedSet = new Set(); // Set of satellite objects currently selected
    let lastClickedIdx = null;   // for shift-click range selection
    let toolbarEl = null;
    // flat index across all sat nodes for shift-click range selection
    let flatListIdx = 0;

    // Mass-edit toolbar removed — satellite editing now handled via tree UI
function ensureToolbar() {
    return null; // no toolbar

        if (toolbarEl) return toolbarEl;
        toolbarEl = document.createElement('div');
        toolbarEl.className = 'mass-edit-toolbar';
        toolbarEl.style.display = 'none';
        toolbarEl.style.marginBottom = '6px';
        toolbarEl.style.background = 'rgba(255,255,255,0.05)';
        toolbarEl.style.padding = '4px';
        toolbarEl.style.borderRadius = '4px';
        toolbarEl.style.fontSize = '11px';
        toolbarEl.style.display = 'flex';
        toolbarEl.style.gap = '4px';
        function addBtn(label, handler) {
            const b = document.createElement('button');
            b.textContent = label; b.style.fontSize = '11px';
            b.onclick = handler; toolbarEl.appendChild(b);
        }
        addBtn('Set Colour', () => {
            if (!selectedSet.size) return;
            const input = document.createElement('input'); input.type = 'color'; input.style.display = 'none';
            document.body.appendChild(input);
            input.oninput = e => {
                selectedSet.forEach(s => { s.overrideColor = e.target.value; });
                window.updateAllSatColors && window.updateAllSatColors();
                document.body.removeChild(input);
            };
            input.click();
        });
        addBtn('Assign →', () => {
            if (!selectedSet.size) return;
            const name = prompt('Assign selected to constellation (existing name):', '');
            if (!name) return;
            selectedSet.forEach(s => window.assignSatellite(s, name));
            window.updateAllSatColors && window.updateAllSatColors();
            render();
        });
        addBtn('Remove from Constellation', () => {
            selectedSet.forEach(s => window.unassignSatellite(s));
            window.updateAllSatColors && window.updateAllSatColors();
            render();
        });
        addBtn('Sensor Override', () => {
            const fov = prompt('Field-of-view (deg)?'); if (fov === null) return;
            const range = prompt('Range (km)?'); if (range === null) return;
            selectedSet.forEach(s => { s.overrideSensor = { fov: parseFloat(fov), range: parseFloat(range) }; });
        });
        addBtn('Clear Overrides', () => {
            selectedSet.forEach(s => { delete s.overrideColor; delete s.overrideSensor; });
            window.updateAllSatColors && window.updateAllSatColors();
            render();
        });
        return toolbarEl;
    }

    // generic helper to apply selection class and maintain selectedSet
    function selectNode(node, yes){
        if(node.dataset.type==='sensor') return;
        const idx = parseInt(node.dataset.idx);
        const objArr = node.dataset.type==='ground'? window.groundStations : window.satellites;
        const obj = objArr && objArr[idx];
        if(!obj) return;
        if(yes){ node.classList.add('selected'); selectedSet.add(obj); }
        else { node.classList.remove('selected'); selectedSet.delete(obj); }
    }

    // toolbar created, reuse existing container reference

    function render() {
        const filter = filterText; // already lowercase
        container.innerHTML = '';
        // insert toolbar
        const tb = ensureToolbar();
        if(tb) container.appendChild(tb);
        flatListIdx = 0;
        // moved to top of render
        // ---- Build tree ----
        // Root: Satellites
        const satRoot = buildRoot('Satellites');
        window.satellites.forEach(s=>{
            if(filter && !s.name.toLowerCase().includes(filter)) return;
            satRoot.childBox.appendChild(buildObjectNode('satellite',s));
        });

        // Root: Ground Stations (if available)
        if(Array.isArray(window.groundStations) && window.groundStations.length){
            const gsRoot = buildRoot('Ground Stations');
            window.groundStations.forEach(gs=>gsRoot.childBox.appendChild(buildObjectNode('ground',gs)));
        }
        

        
    }

    // Ensure toolbar visibility matches current selection
    function updateToolbarVisibility(){
        if(!toolbarEl) return;
        toolbarEl.style.display = selectedSet.size? 'flex':'none';
    }

    function buildRoot(label){
            const root=document.createElement('div');root.className='tree-root';
            const header=document.createElement('div');header.className='tree-header';
            const caret=document.createElement('span');caret.textContent='▾';caret.style.cursor='pointer';caret.style.marginRight='4px';
            header.appendChild(caret);
            header.appendChild(document.createTextNode(label));
            root.appendChild(header);
            const childBox=document.createElement('div');childBox.style.paddingLeft='16px';root.appendChild(childBox);
            header.onclick=()=>{
                const isOpen=caret.textContent==='▾';
                caret.textContent=isOpen?'▸':'▾';
                childBox.style.display=isOpen?'none':'block';
            };
            container.appendChild(root);
            root.childBox=childBox; // expose
            return root;
        }

        function buildObjectNode(type,obj){
            const thisIdx = flatListIdx++;
            const div=document.createElement('div');div.className='tree-obj';div.dataset.idx=thisIdx;div.dataset.type=type;
            const chk=document.createElement('input');chk.type='checkbox';chk.style.marginRight='4px';chk.checked=!!obj.constellation;chk.style.display='none';div.appendChild(chk);
            const label=document.createElement('span');label.textContent=obj.name;label.style.cursor='pointer';div.appendChild(label);
            // Sensors children
            if(Array.isArray(obj.sensors)&&obj.sensors.length){
                const caret=document.createElement('span');caret.textContent='▾';caret.style.cursor='pointer';caret.style.marginRight='4px';div.insertBefore(caret,label);
                const childBox=document.createElement('div');childBox.style.paddingLeft='16px';div.appendChild(childBox);
                const toggle=()=>{
                    const open=caret.textContent==='▾';caret.textContent=open?'▸':'▾';childBox.style.display=open?'none':'block';
                };caret.onclick=toggle;label.ondblclick=toggle;
                obj.sensors.forEach(sen=>childBox.appendChild(buildSensorNode(sen)));
            }
            // selection handlers (only on object rows)
            function toggleSelect(range=false){
                if(range && lastClickedIdx!==null){
                    const start=Math.min(lastClickedIdx,thisIdx);const end=Math.max(lastClickedIdx,thisIdx);
                    container.querySelectorAll('.tree-obj').forEach(node=>{
                        const idx=parseInt(node.dataset.idx);
                        if(idx>=start && idx<=end){ selectNode(node,true); }
                    });
                }else{
                    const nowSel=!div.classList.contains('selected');
                    selectNode(div,nowSel);
                    lastClickedIdx=thisIdx;
                    // Zoom to the clicked object (satellite or ground station)
                    if(typeof window.zoomToSatellite==='function' && !range){
                        window.zoomToSatellite(obj);
                    }
                }
                updateToolbarVisibility();
            }
            label.onclick=e=>toggleSelect(e.shiftKey);
            return div;
        }

        function buildSensorNode(sensor){
            const div=document.createElement('div');div.className='tree-sensor';div.dataset.type='sensor';div.style.fontSize='11px';div.style.color='#aaa';
            div.textContent=`${sensor.name} (FOV ${sensor.fov||sensor.halfAngle}°, R ${sensor.range}km)`;
            return div;
        }
            /* legacy constellation code (commented out)
let membersArr = constObj.members || [];
        const root = document.createElement('div');
        root.className = 'tree-const';
        const header = document.createElement('div');
        header.className = 'tree-header';
        const caret = document.createElement('span'); caret.textContent = '▸'; caret.style.cursor = 'pointer'; caret.style.marginRight = '4px';
        let expanded = false;
        header.appendChild(caret);
        const nameSpan = document.createElement('span');
        nameSpan.innerHTML = `<span class="color-swatch" style="background:${constObj.color}"></span>${constObj.name}`;
        header.appendChild(nameSpan);
        if (!constObj.isSpecial) {
            // click colour
            nameSpan.onclick = () => {
                const newColor = prompt('Hex colour for ' + constObj.name, constObj.color);
                if (newColor) {
                    updateConstellationColor(constObj.name, newColor);
                    render();
                }
            };
        }
        root.appendChild(header);
        const childBox = document.createElement('div'); childBox.style.display = 'none'; childBox.style.paddingLeft = '16px';
        header.onclick = () => {
            expanded = !expanded;
            caret.textContent = expanded ? '▾' : '▸';
            childBox.style.display = expanded ? 'block' : 'none';
        };
        membersArr.forEach(sat => childBox.appendChild(buildSatNode(sat, constObj)));
            // continue
        // add any other satellites assigned to this constellation but not in members array (e.g., after reload)
        
        root.appendChild(childBox);
        return root;
    }

    
            const thisIdx = flatListIdx++;

        const div = document.createElement('div');
            div.dataset.idx = thisIdx;
        div.className = 'tree-sat';
        const chk = document.createElement('input'); chk.type = 'checkbox'; chk.style.marginRight = '4px';
        chk.checked = !!sat.constellation && sat.constellation === constObj.name;
        chk.onchange = () => {
            if (chk.checked) assignSatellite(sat, constObj.name);
            else unassignSatellite(sat);
            render(); // re-render for counts
        };
        div.appendChild(chk);
        const label = document.createElement('span'); label.textContent = sat.name;
            label.style.cursor = 'pointer';
        div.appendChild(label);
            // --- selection handler ---
            
                if(range && lastClickedIdx!==null){
                    const start=Math.min(lastClickedIdx,thisIdx);const end=Math.max(lastClickedIdx,thisIdx);
                    container.querySelectorAll('.tree-sat').forEach(node=>{
                        const idx=parseInt(node.dataset.idx);
                        if(idx>=start && idx<=end){ selectNode(node,true); }
                    });
                }else{
                    const nowSelected = !div.classList.contains('selected');
                    selectNode(div, nowSelected);
                    lastClickedIdx = thisIdx;
                }
                updateToolbarVisibility();
            }
            function selectNode(node, yes){
                if(node.dataset.type==='sensor') return;
                const satIdx = parseInt(node.dataset.idx);
                const satObj = window.satellites[satIdx];
                if(yes){ node.classList.add('selected'); selectedSet.add(satObj); }
                else { node.classList.remove('selected'); selectedSet.delete(satObj); }
            }
            label.onclick = (e)=>{ toggleSelect(e.shiftKey); };

        return div;
    }

    // Expose for external update triggers
    function updateToolbarVisibility(){
        if(!toolbarEl) return;
        toolbarEl.style.display = selectedSet.size? 'flex':'none';
    }

    */

window.refreshSatTree = () => { selectedSet.clear(); lastClickedIdx=null; render(); };
window.setSatFilter = str => { filterText = (str||'').toLowerCase(); render(); };



    render();
}

// Expose the tree builder globally for inline scripts
window.initTree = initTree;
