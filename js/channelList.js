// Copyright 2017 Sebastian Ouellette

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use strict";

function createChannels(g) {
    // Clear the channels list
    let channelList = document.getElementById('channel-elements');
    while (channelList.firstChild)
        channelList.removeChild(channelList.firstChild);

    // The parent variable will change, realParent will not
    const realParent = document.getElementById('channel-elements');
    let parent = realParent;
    let categoryParent;

    // Sort the channels and add them to the screen
    g.channels.cache
        .array()
        .filter((c) => c.type == 'category')
        .sort((c1, c2) => c1.position - c2.position)
        .forEach((c) => {
            if (c.type == 'category') {
                let category = document.createElement('div');
                category.classList.add('category');
                category.classList.add('open');
                category.id = c.id;
                realParent.appendChild(category);

                // Container for the category svg and name
                let nameCategory = document.createElement('div');
                nameCategory.classList.add('categoryNameContainer');
                category.appendChild(nameCategory);

                // Create the svg icon
                let svg = document.createElement('img');
                // svg.type = "image/svg+xml";
                // svg.data
                svg.src = './resources/icons/categoryArrow.svg';
                svg.classList.add('categorySVG');
                nameCategory.appendChild(svg);

                // Create the category name
                let text = document.createElement('h5');
                text.classList.add('categoryText');
                text.innerText = c.name;
                nameCategory.appendChild(text);

                // Create the container for all the channels
                let div = document.createElement('div');
                div.classList.add('channelContainer');
                category.appendChild(div);

                // Event listener for opening and closing
                nameCategory.addEventListener('click', (event) => {
                    category.classList.toggle('open');
                });

                // Set the parent for the next added channels
                parent = div;
                categoryParent = c;
            }
        });

    let openedDefaultChannel = false;
    let defaultDiv;
    g.channels.cache
        .array()
        .map((c) => {
            c.rawPosition =
                c.type == 'voice'
                    ? c.rawPosition + g.channels.cache.size
                    : c.rawPosition;
            return c;
        }) // Put voice channels after text channels
        .filter((c) => c.type != 'category')
        .sort((c1, c2) => c1.rawPosition - c2.rawPosition)
        .forEach((c) => {
            // At this point, the channel is either text or voice
            let div = document.createElement('div');
            div.classList.add('channel');
            // div.classList.add(c.type);
            div.id = c.id;

            // check if user can access the channel
            let blocked = false;
            if (
                !c.permissionsFor(g.me).has('VIEW_CHANNEL')
            ) {
                blocked = true;
                div.classList.add('blocked');
            }

            // Create the svg icon
            let svg = document.createElement('img');
            // svg.type = "image/svg+xml";
            // svg.data
            svg.src = `./resources/icons/${c.type}Channel${
                blocked ? 'Blocked' : ''
            }.svg`;
            svg.classList.add('channelSVG');
            svg.classList.add(c.type);
            div.appendChild(svg);

            // Add the text
            let channelName = document.createElement('h5');
            channelName.classList.add('viewableText');
            channelName.innerText = c.name;
            div.appendChild(channelName);

            // Finally, add it to the parent
            if (c.parentID)
                document
                    .getElementById(c.parentID)
                    .getElementsByTagName('div')[1]
                    .appendChild(div);
            else
                realParent.insertBefore(
                    div,
                    realParent.querySelector('.category')
                );

            if (!blocked) {
                // Open the channel if it's stored in the database as last opened
                if (settings.guilds[settings.lastGuild] == c.id) {
                    channelSelect(c, div);
                    openedDefaultChannel = true;
                }

                if (global.selectedChanDiv && div.id == selectedChanDiv.id) {
                    div.classList.add('selectedChan');
                    selectedChanDiv = div;
                }
                div.addEventListener('click', (event) => {
                    let previous = realParent.querySelector('.selectedChan');
                    let id;
                    if (previous) {
                        id = previous.id;
                        if (id != c.id)
                            previous.classList.remove('selectedChan');
                    }

                    if (id != c.id) {
                        // Set the channel as the last channel in the guild
                        settings.guilds = (() => {
                            let obj = {};
                            obj[c.guild.id] = c.id;
                            return { ...obj };
                        })();

                        div.classList.add('selectedChan');
                        channelSelect(c, div);
                    }
                });
            }
        });

    if (!openedDefaultChannel) {
        let chan = g.channels.cache
            .filter((c) => c.type.includes('text'))
            .filter((c) => c.permissionsFor(g.me).has('VIEW_CHANNEL'))
            .sort((a, b) => a.rawPosition - b.rawPosition)
            .first();

        // Check if chan exists
        if (chan === undefined)
            console.error('No available text channel to open');
        else {
            // Select the first available channel
            let div = document.getElementById(chan.id);
            div.classList.add('selectedChan');
            channelSelect(chan, div);
        }
    }
}
