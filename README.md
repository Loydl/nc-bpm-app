# BPMN file editor for Nextcloud

![Static analysis](https://github.com/Loydl/nc-bpm-app/workflows/Static%20analysis/badge.svg)
![PHP Tests](https://github.com/Loydl/nc-bpm-app/workflows/PHP%20Tests/badge.svg)
![Lint](https://github.com/Loydl/nc-bpm-app/workflows/Lint/badge.svg)
![Downloads](https://img.shields.io/github/downloads/Loydl/nc-bpm-app/total.svg)
![GitHub release](https://img.shields.io/github/release/Loydl/nc-bpm-app.svg)

This app integrates the [BPMN.io editor](https://bpmn.io) into Nextcloud.

## :heart_eyes: Features
This integration provides the following features:

* **Editor** Edit BPMN diagrams on every folder with write permission
* **Viewer** View BPMN diagrams if you have no write permission
* **New diagrams** Create new diagrams via the Nextcloud files app

## :rocket: Install it
The easiest way to install this app is by using the [Nextcloud app store](https://apps.nextcloud.com/apps/files_bpmn).
If you like to build from source, please continue reading.

To install it change into your Nextcloud's apps directory:

    cd nextcloud/apps

Then run:

    git clone https://github.com/Loydl/nc-bpm-app.git files_bpmn

Then install the dependencies using:

    yarn install && composer install && yarn build
