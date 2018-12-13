/**
 * This file is part of the vscode-powertools distribution.
 * Copyright (c) e.GO Digital GmbH, Aachen, Germany (https://www.e-go-digital.com/)
 *
 * vscode-powertools is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, version 3.
 *
 * vscode-powertools is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import * as ego_contracts from './contracts';
import * as vscode_helpers from 'vscode-helpers';


/**
 * Options for 'replaceValues()' function.
 */
export interface ReplaceValuesOptions {
    /**
     * One or more build-in values.
     */
    buildInValues?: ego_contracts.Value | ego_contracts.Value[];
}


/**
 * A value that uses a function.
 */
export class FunctionValue implements ego_contracts.Value {
    /**
     * Initializes a new instance of that class.
     *
     * @param {Function} _FUNCTION The function that provides the value.
     * @param {string} [name] The optional name.
     */
    constructor(
        private readonly _FUNCTION: () => any,
        public readonly name?: string,
    ) { }

    /**
     * @inheritdoc
     */
    public get value(): any {
        return this._FUNCTION();
    }
}

/**
 * A static value.
 */
export class StaticValue implements ego_contracts.Value {
    /**
     * Initializes a new instance of that class.
     *
     * @param {any} value The value.
     * @param {string} [name] The optional name.
     */
    constructor(
        public readonly value: any,
        public readonly name?: string,
    ) { }
}


/**
 * Handles a value as string and replaces placeholders.
 *
 * @param {ego_contracts.WithValues} obj The object with value entries.
 * @param {any} val The input value.
 * @param {opts} [opts] Additional options.
 *
 * @return {string} The output value.
 */
export function replaceValues(
    obj: ego_contracts.WithValues, val: any,
    opts?: ReplaceValuesOptions
): string {
    val = vscode_helpers.toStringSafe(val);

    if (!opts) {
        opts = <any>{};
    }

    const ALL_VALUES = vscode_helpers.asArray(
        opts.buildInValues
    ).concat(
        toValues(obj)
    );

    // ${VALUE_NAME}
    val = val.replace(/(\$)(\{)([^\}]*)(\})/gm, (match, varIdentifier, openBracket, varName: string, closedBracked) => {
        let newValue = vscode_helpers.toStringSafe(
            match
        );

        varName = vscode_helpers.normalizeString(varName);

        const LAST_VALUE = vscode_helpers.from(ALL_VALUES).lastOrDefault(v => {
            return vscode_helpers.normalizeString(v.name) === varName;
        }, false);

        if (false !== LAST_VALUE) {
            newValue = vscode_helpers.toStringSafe(
                LAST_VALUE.value
            );
        }

        return newValue;
    });

    return val;
}

/**
 * Creates value objects from a storage of value entries.
 *
 * @param {ego_contracts.WithValues} obj The object with value entries.
 *
 * @return {ego_contracts.Value[]} The list of value objects.
 */
export function toValues(obj: ego_contracts.WithValues): ego_contracts.Value[] {
    const VALUES: ego_contracts.Value[] = [];

    if (obj) {
        const ALL_ENTRIES = obj.values;
        if (ALL_ENTRIES) {
            for (const NAME in ALL_ENTRIES) {
                const ENTRY = ALL_ENTRIES[NAME];

                VALUES.push(
                    new StaticValue(
                        ENTRY, NAME
                    )
                );
            }
        }
    }

    return VALUES;
}
