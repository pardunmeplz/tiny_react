const idGenerator = {
    id: [0],
    getId: function() { return this.id.reduce((a, b) => a + "." + b, "") },
    replace: function(id: number) { this.id[this.id.length - 1] = id },
    addChild: function() { this.id.push(0) },
    dropChild: function() { this.id.pop() },
    reset: function() { this.id = [0] }
}

export default idGenerator 
