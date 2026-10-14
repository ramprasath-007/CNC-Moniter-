
import { getAdminDatabase } from '../../../src/firebaseAdmin';

export async function GET() {
    try {
        const database = getAdminDatabase();

        const snapshot = await database
            .ref('machines/CNC01/statusHistory')
            .limitToLast(50)
            .once('value');

        return Response.json({
            success: true,
            records: snapshot.val() ?? {},
        });
    } catch (error) {
        console.error('Machine status API error:', error);

        return Response.json(
            {
                success: false,
                error: 'Unable to load machine status history.',
            },
            { status: 500 }
        );
    }
}
