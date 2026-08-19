export namespace main {
	
	export class Appearance {
	    opacity: number;
	    theme: string;
	
	    static createFrom(source: any = {}) {
	        return new Appearance(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.opacity = source["opacity"];
	        this.theme = source["theme"];
	    }
	}
	export class Behavior {
	    alwaysOnTop: boolean;
	    clickThrough: boolean;
	    locked: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Behavior(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.alwaysOnTop = source["alwaysOnTop"];
	        this.clickThrough = source["clickThrough"];
	        this.locked = source["locked"];
	    }
	}
	export class Size {
	    width: number;
	    height: number;
	
	    static createFrom(source: any = {}) {
	        return new Size(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.width = source["width"];
	        this.height = source["height"];
	    }
	}
	export class Position {
	    x: number;
	    y: number;
	
	    static createFrom(source: any = {}) {
	        return new Position(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.x = source["x"];
	        this.y = source["y"];
	    }
	}
	export class Note {
	    id: string;
	    title?: string;
	    content: string;
	    position: Position;
	    size: Size;
	    appearance: Appearance;
	    behavior: Behavior;
	    createdAt: number;
	    updatedAt: number;
	
	    static createFrom(source: any = {}) {
	        return new Note(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.content = source["content"];
	        this.position = this.convertValues(source["position"], Position);
	        this.size = this.convertValues(source["size"], Size);
	        this.appearance = this.convertValues(source["appearance"], Appearance);
	        this.behavior = this.convertValues(source["behavior"], Behavior);
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class NotesFile {
	    version: number;
	    notes: Note[];
	
	    static createFrom(source: any = {}) {
	        return new NotesFile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.version = source["version"];
	        this.notes = this.convertValues(source["notes"], Note);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	

}

