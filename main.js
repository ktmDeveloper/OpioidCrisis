class opiodDeathVisual {
    constructor(root, url) {
        this.root = root
        this.url = url
        this.unfilteredData = null

        //reference to nodes
        this.graph = root.querySelector('.graph')
        this.controls = root.querySelector('.controls ul')
        this.canvas = root.querySelector('#myChart')

        //helpers
        this.currActive = null
        this.loaded = false

        //data settings for each filter
        this.filterBySexData = {
            datasets: [{
                data: [], //Male, Female, Both 
                backgroundColor: ['rgb(54, 162, 235)', 'rgb(255, 99, 132)', 'rgb(255, 205, 86)'],
            }],
            labels: []
        }

        this.filterByYearData = {
            labels: [],
            datasets: [{
                data: [], //this data has to be respective to the labels above
                backgroundColor: 'rgb(70,205,207)',
                label: 'Death By Year',
                fill: false,
                pointRadius: 10,
                pointHoverRadius: 15
            }]
        }

        this.filterByCountryData = {
            labels: [],
            datasets: [{
                data: [], //this data has to be respective to the labels above
                backgroundColor: 'rgb(70,205,207)',
                label: 'Death By Country',
                fill: false
            }]
        }

        //charSettings for each filter 
        this.chartSettings = {
            'sex': {
                type: 'doughnut',
                data: this.filterBySexData,
                options: {
                    title: {
                        display: true,
                        text: 'Death Sorted by Sex',
                        fontSize: 18
                    },
                    legend: {
                        labels: {
                            fontSize: 16
                        }
                    },
                    maintainAspectRatio: false,
                    animation: {
                        duration: 0
                    }
                }

            },
            'year': {
                type: 'line',
                data: this.filterByYearData,
                options: {
                    legend: false,
                    title: {
                        display: true,
                        text: 'Death Sorted by Year',
                        fontSize: 18
                    },
                    scales: {
                        xAxes: [{
                            ticks: {
                                fontSize: 16
                            }
                        }],
                        yAxes: [{
                            ticks: {
                                fontSize: 16
                            }
                        }]
                    },
                    maintainAspectRatio: false,
                    animation: {
                        duration: 0
                    }
                }
            },
            'country': {
                type: 'horizontalBar',
                data: this.filterByCountryData,
                options: {
                    scales: {
                        xAxes: [{
                            ticks: {
                                beginAtZero: true,
                                stepSize: 5,
                                fontSize: 16
                            }
                        }],
                        yAxes: [{
                            ticks: {
                                fontSize: 16
                            }
                        }]
                    },
                    legend: false,
                    title: {
                        display: true,
                        text: 'Death Sorted by Country',
                        fontSize: 18
                    },
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 0
                    }
                }

            }
        }

        //attach eventListeners
        this.controls.addEventListener('click', (e) => {
            if (e.target.matches('li')) {
                this.changeGraph(e.target)
            }
        })

        //initial call to load data. After the async call, filter the data and initialize the chart view 
        this.loadData(this.url)
    }

    //fetch the json data
    loadData(url) {
        fetch(url)
            .then(res => res.json())
            .then(data => {
                this.unfilteredData = data

                this.filterData()
                this.loaded = true
                this.updateUI()

                //get the node with '.active' class and pass in for initial view
                this.changeGraph(this.root.querySelector('.controls .active'))
            })
            .catch(err => { //simple error handling
                alert('Error occured. Check console for details')
                console.log(err)
            })
    }

    //loop over rawData and and pass into filterBySexData, filterByYearData and filterByCountryData obeying the chartJS requirements
    filterData() {
        //There are a lot of loops inside this function, but no loop is inside another loop, so the run time should still be in the order of O(n)

        //I use map instead of object because Map is easier to manipulate
        let unfilteredSexData = new Map()
        let unfilteredYearData = new Map()
        let unfilteredCountryData = new Map()

        this.unfilteredData.forEach((record) => {
            unfilteredSexData.set(record['sex_name'], unfilteredSexData.get(record['sex_name']) + 1 || 1)
            unfilteredYearData.set(record['year'], unfilteredYearData.get(record['year']) + 1 || 1)
            unfilteredCountryData.set(record['location_name'], unfilteredCountryData.get(record['location_name']) + 1 || 1)

        })

        //sort the entries by year and alphabetically, and then only pass it to chartJS datasets
        let sortedYearData = new Map([...unfilteredYearData.entries()].sort((a, b) => a[0] - b[0]))
        let sortedCountryData = new Map([...unfilteredCountryData.entries()].sort())

        this.populateData(unfilteredSexData, this.filterBySexData)
        this.populateData(sortedYearData, this.filterByYearData)
        this.populateData(sortedCountryData, this.filterByCountryData)

        //cleaning up temporary variables
        unfilteredSexData = null
        unfilteredYearData = null
        unfilteredCountryData = null
        sortedYearData = null
        sortedCountryData = null
    }

    populateData(unfiltered, filtered) {
        unfiltered.forEach((val, key) => {
            filtered.labels.push(key)
            filtered.datasets[0].data.push(val)
        })
    }


    changeGraph(node) {
        if (node != this.currActive) {

            this.currActive = node

            //remove the current canvas element and create a new one
            this.graph.removeChild(this.canvas)
            let canvas = document.createElement("canvas")
            canvas.setAttribute('id', 'myChart')
            this.graph.appendChild(canvas)
            this.canvas = canvas

            let filterBy = node.getAttribute('data-filter')

            let containerHeight = 'auto' //to scale the container according to the size of graph
            if (filterBy === 'country') {
                containerHeight = this.filterByCountryData.labels.length * 40
            }

            this.graph.setAttribute('style', `height: ${containerHeight}px`)
            new Chart(canvas, this.chartSettings[filterBy])
            this.updateUI()
        }
    }

    updateUI() {
        if (this.loaded) {
            this.root.querySelector('.loading').style.display = 'none'
        }
        if (this.currActive) {
            this.root.querySelector('.active').classList.remove('active')
            this.currActive.classList.add('active')
        }

    }
}

(function() { //iife to avoid globals
    let root = document.getElementById('opiodDeathVisual')
    //let url = 'http://ghdx.healthdata.org/gbd-results-tool?params=gbd-api-2017-permalink/7552e97b581d17efa4ee1aaa568c193b'
    let url = 'https://api.myjson.com/bins/10r9rs'
    new opiodDeathVisual(root, url)
})();
