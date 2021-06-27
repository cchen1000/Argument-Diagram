import { graph } from '../graph.js';
import { createClaim, createDependentPremise, } from "../menu/CreateClaim.js";
import { createLink } from "../tools/LinkButton.js";
import { legend } from './Legend.js';
// not fully working
function parseJSON(cells, legend_import) {
    let ids = {};
    var i = 0, len = cells.length;
    //parse cells
    while (i < len) {
        const type = cells[i].type;
        if (type === "standard.Link") {
            const source = cells[i].source.id;
            const target = cells[i].target.id;
            createLink(ids[source].rect, ids[target].rect);
        }
        else {
            //skip if has parent, will be added when dp is added
            if (cells[i].parent) {
                console.log("imported cell has parent");
                i++;
                continue;
            }
            if (type === "claim") {
                importClaim(cells[i], ids);
            }
            else if (type === "objection") {
                importClaim(cells[i], ids);
            }
            // insert dependent premise here
            else if (type === "dependent-premise") {
                //get list of embed ids
                let embeds;
                embeds = cells[i].embeds;
                //create all embeded children
                let rects;
                rects = [];
                embeds.forEach(id => {
                    let child = getCellById(id, cells);
                    //create child
                    let rect = importClaim(child, ids);
                    rects.push(rect);
                });
                //embed children
                let first_child = rects[0];
                for (let j = 1; j < rects.length; j++) {
                    const second_child = rects[j];
                    //create dependent premise
                    first_child = createDependentPremise(first_child, second_child);
                }
                ids[cells[i].id] = first_child;
            }
        }
        i++;
    }
    //build legend
    legend.enable();
    for (let id in ids) {
        legend.insert(ids[id], legend_import[id], true);
    }
    if (legend.active) {
        $('#legend-button').trigger('click');
    }
}
export function importGraph() {
    const input = document.createElement("input");
    input.type = "file";
    // choosing the file
    input.onchange = function (ev) {
        const file = ev.target.files[0];
        if (file.type !== "application/json") {
            alert("File must be of .JSON type");
            return;
        }
        // read the file
        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = function (readerEvent) {
            const content = readerEvent.target.result;
            const erase = window.confirm("Erase your current workspace?");
            if (erase) {
                graph.clear();
                legend.clear();
                legend.disable();
                const dataObj = JSON.parse(content);
                parseJSON(dataObj.cells, dataObj.legend);
            }
        };
    };
    input.click();
}
export function exportGraph() {
    let graph_data = JSON.stringify(graph.toJSON(), null, 2);
    let dataObj = JSON.parse(graph_data);
    dataObj.legend = legend.toExportForm();
    console.log(dataObj);
    const data = JSON.stringify(dataObj, null, 2);
    const filename = "myDiagram.json"; // default name
    const file = new Blob([data], { type: "application/json" });
    if (window.navigator.msSaveOrOpenBlob) { // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    }
    else { // Others
        const a = document.createElement("a");
        const url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}
function getCellById(id, cells) {
    for (let cell of cells) {
        if (cell.id == id) {
            return cell;
        }
    }
    ;
    throw new Error("Cell id not found");
}
function importClaim(cell, ids) {
    const pos = cell.position;
    let text;
    if (cell.inLegendForm) {
        text = cell.storedInfo.initialText;
    }
    else {
        text = cell.attrs.text.text;
    }
    const arg = createClaim(pos.x, pos.y, text);
    ids[cell.id] = arg;
    return arg.rect;
}
