"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function groupBy(collection, lambda) {
    return collection
        .reduce((group, current) => {
        const key = lambda(current);
        if (!group.has(key)) {
            group.set(key, []);
        }
        group.get(key)
            .push(current);
        return group;
    }, new Map());
}
exports.groupBy = groupBy;
//# sourceMappingURL=util.js.map