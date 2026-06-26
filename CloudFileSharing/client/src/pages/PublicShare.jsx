import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { shareService } from "../services/shareService";

function PublicShare() {
    const { token } = useParams();

    useEffect(() => {
        shareService.getShareByToken(token);
    }, [token]);

    return (
        <div>
            Public Share Page
        </div>
    );
}

export default PublicShare;